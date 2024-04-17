"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { base64URLStringToBuffer, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { parseAuthenticatorData } from "@simplewebauthn/server/helpers";
import cbor from "cbor";
import type { NextPage } from "next";
import { useLocalStorage } from "usehooks-ts";
import { Hex, toHex, zeroAddress } from "viem";
import { ArrowLongRightIcon as ArrowRightIcon } from "@heroicons/react/24/outline";
import { useBundler } from "~~/hooks/scaffold-eth/useBundler";
import { redis } from "~~/services/redis";
import { generateLoginAuth, generateRegisterAuth, verifyAuth } from "~~/services/webAuthn";
import { notification } from "~~/utils/scaffold-eth";
import { BASE_PAY_DATA } from "~~/utils/scaffold-eth/constants";
import { mockBytes32 } from "~~/utils/scaffold-eth/userOP";

const Home: NextPage = () => {
  const router = useRouter();
  const [walletName, setWalletName] = useState<string | undefined>(undefined);

  const [currentWalletData, setCurrentWalletData] = useLocalStorage<{
    pubKey: { x: Hex; y: Hex };
    rawId: Hex;
    walletAddress: Hex;
  }>("currentWalletData", {
    pubKey: { x: mockBytes32 as Hex, y: mockBytes32 as Hex },
    rawId: zeroAddress,
    walletAddress: zeroAddress,
  });

  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>("isLoggedIn", false);
  const {
    // address: walletAddress,
    // buildUserOP,
    calculateWalletAddress,
  } = useBundler({ publicKey: currentWalletData?.pubKey });

  // methods
  const onRegister = async () => {
    try {
      const generateData = {
        rpID: window.location.hostname,
        userID: walletName,
        userName: walletName,
      };
      const generate = await generateRegisterAuth({ ...generateData });
      const { options } = generate;
      // REGISTER
      const authRegisterResponse = await startRegistration({
        ...options,
      });

      // VERIFY REGISTRATION
      const reqDataVerifyData = {
        authResponse: authRegisterResponse,
        expectedChallenge: options.challenge,
        rpID: window.location.hostname,
        expectedOrigin: window.location.origin,
      };
      const responseVerify = await verifyAuth({ ...reqDataVerifyData });
      const { verification } = responseVerify;

      if (verification !== null && verification.verified) {
        // const { id, response } = authRegisterResponse;
        // const { publicKey } = response;
        const decodedAttestationObj = cbor.decode(
          base64URLStringToBuffer(authRegisterResponse.response.attestationObject),
        );
        const authData = parseAuthenticatorData(decodedAttestationObj.authData);
        const publicKey = cbor.decode(authData?.credentialPublicKey?.buffer as ArrayBuffer);
        const x = toHex(publicKey.get(-2));
        const y = toHex(publicKey.get(-3));

        const walletAddress = await calculateWalletAddress([x, y]);
        // SAVE PUBKEY TO FACTORY
        const currentWalletData = {
          walletName,
          rawId: toHex(new Uint8Array(base64URLStringToBuffer(authRegisterResponse.rawId as any))),
          pubKey: {
            x,
            y,
          },
          walletAddress: walletAddress as Hex,
        };

        // add data on redis
        await redis.hset(BASE_PAY_DATA, {
          [currentWalletData.rawId]: { ...currentWalletData },
        });

        setCurrentWalletData({ ...currentWalletData });
        setIsLoggedIn(true);
        router.push(`/wallet/${walletAddress}`);
      } else {
        notification.error("Registration failed, not verified");
      }
    } catch (error) {
      console.log("error register", error);
    }
  };
  const onLogin = async () => {
    try {
      const loginAuthData = {
        // type: "auth",
        rpID: window.location.hostname,
        // userID: walletName,
        // userName: walletName,
      };
      // const response = await axios.post("/api/generate-auth", { ...reqData });
      const { options } = await generateLoginAuth({ ...loginAuthData });

      const authResponse = await startAuthentication({
        ...options,
      });
      // logic to fetch and set current wallet public key

      const rawId = toHex(new Uint8Array(base64URLStringToBuffer(authResponse.rawId as any)));
      const currentWalletData: any = await redis.hget(BASE_PAY_DATA, rawId);
      setCurrentWalletData({ ...currentWalletData });
      setIsLoggedIn(true);
    } catch (error) {
      console.log("on sign error", error);
    }
  };

  // use effects
  useEffect(() => {
    if (isLoggedIn && currentWalletData.walletAddress) {
      router.push(`/wallet/${currentWalletData.walletAddress}`);
    }
  }, [isLoggedIn]);

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <div className="mt-56">
          <div className="flex justify-center items-center">
            <Image src="/base-logo-in-blue.png" alt="My Image" width={50} height={30} />
            <div className="m-2 text-2xl">BasePay</div>
          </div>
          <div className="m-2 text-xs">A smart contract wallet with passkey</div>
        </div>
        <div className="mt-2">
          <div className="join w-[100%]">
            <input
              className="input input-bordered join-item w-[80%]"
              placeholder="Enter wallet name"
              value={walletName ? walletName : ""}
              onChange={event => {
                setWalletName(event.target.value);
              }}
            />
            <button
              className="btn btn-primary join-item rounded-r-full w-[20%] tooltip tooltip-primary"
              data-tip="Create wallet"
              disabled={!walletName}
              onClick={onRegister}
            >
              <ArrowRightIcon width={20} />
            </button>
          </div>
          <div className="divider">Or</div>
          <div>
            <button className="btn btn-secondary w-full my-2" onClick={onLogin}>
              Login
              <ArrowRightIcon width={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
