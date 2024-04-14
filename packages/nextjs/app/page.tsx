"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Address, Balance } from "../components/scaffold-eth";
import { base64URLStringToBuffer, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { parseAuthenticatorData } from "@simplewebauthn/server/helpers";
import cbor from "cbor";
import type { NextPage } from "next";
import { useIsMounted, useLocalStorage } from "usehooks-ts";
import { V06 } from "userop";
import { Hex, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  PhoneIcon as PayContactIcon,
  ArrowDownLeftIcon as ReceiveIcon,
  ArrowLeftOnRectangleIcon as SaveAddressIcon,
  QrCodeIcon as ScanIcon,
  MagnifyingGlassIcon as SearchIcon,
} from "@heroicons/react/24/outline";
import { useBundler } from "~~/hooks/scaffold-eth/useBundler";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { generateLoginAuth, generateRegisterAuth, verifyAuth } from "~~/services/webAuthn";
import { notification } from "~~/utils/scaffold-eth";
import { emptyHex, publicClientStackUp } from "~~/utils/scaffold-eth/userOP";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Home: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [iframeUrl, setIframeUrl] = useState<string>();
  const [walletName, setWalletName] = useLocalStorage<any>("walletName", "N");

  const [currentWalletData, setCurrentWalletData] = useLocalStorage<{ pubKey: { x: Hex; y: Hex }; rawId: Hex }>(
    "currentWalletData",
    { pubKey: { x: "0x", y: "0x" }, rawId: "0x" },
  );

  const { targetNetwork } = useTargetNetwork();
  const isMounted = useIsMounted();

  const { address: walletAddress, buildUserOP } = useBundler({ publicKey: currentWalletData?.pubKey });

  useEffect(() => {
    void delay(1000).then(() => {
      if (isMounted()) {
        if (typeof window === "object") {
          setIframeUrl(window.location.href);
        }
      }
    });
  }, [isMounted]);

  // methods

  const onRegister = async () => {
    try {
      setIsLoading(true);
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
        // address: burnerAddress,
        // user: walletName,
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

        // SAVE PUBKEY TO FACTORY
        const currentWalletData = {
          rawId: toHex(new Uint8Array(base64URLStringToBuffer(authRegisterResponse.rawId as any))),
          pubKey: {
            x,
            y,
          },
        };

        setCurrentWalletData({ ...currentWalletData });
      } else {
        notification.error("Registration failed, not verified");
      }
    } catch (error) {
      setIsLoading(true);
      console.log("error register", error);
    }
  };
  const onLogin = async () => {
    try {
      const loginAuthData = {
        type: "auth",
        rpID: window.location.hostname,
        userID: walletName,
        userName: walletName,
      };
      // const response = await axios.post("/api/generate-auth", { ...reqData });
      const { options } = await generateLoginAuth({ ...loginAuthData });

      const asseResp2 = await startAuthentication({
        ...options,
      });

      console.log(`n-🔴 => onLogin => asseResp2:`, asseResp2);
      // logic to fetch and set current wallet public key
    } catch (error) {
      console.log("on sign error", error);
    }
  };
  const onTx = async () => {
    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClientStackUp.estimateFeesPerGas();
    console.log(`n-🔴 => onTx => maxFeePerGas, maxPriorityFeePerGas:`, maxFeePerGas, maxPriorityFeePerGas);
    const userOp = await buildUserOP({
      calls: [
        {
          dest: "0x18216371e74C9f1820817131911c243241b56d25".toLowerCase() as Hex,
          value: BigInt("1"),
          data: emptyHex,
        },
      ],
      maxFeePerGas: maxFeePerGas as bigint,
      maxPriorityFeePerGas: maxPriorityFeePerGas as bigint,
      keyId: currentWalletData?.rawId as Hex,
    });

    console.log(`n-🔴 => onTx => userOp:`, userOp);
    const userOpHash = await V06.Bundler.SendUserOperationWithEthClient(
      userOp,
      V06.EntryPoint.DEFAULT_ADDRESS,
      publicClientStackUp as any,
    );
    console.log(`n-🔴 => onTx => userOpHash:`, userOpHash);
    const receipt = await V06.Bundler.GetUserOperationReceiptWithEthClient(userOpHash, publicClientStackUp as any);
    console.log(`n-🔴 => onTx => receipt:`, receipt);
  };

  return (
    <>
      <div className="flex flex-col items-start justify-center">
        {/* top action */}
        <div className="flex justify-center items-center w-full p-3">
          {/* search */}
          <div className="w-[85%]">
            <label className="input input-bordered flex items-center gap-2 ">
              <SearchIcon width={20} />
              <button
                // type="text"
                className="bg-base-100 text-gray-400"
                placeholder="Search"
                onClick={() => {
                  router.push("/search");
                }}
              >
                Search
              </button>
            </label>
          </div>

          {/* profile */}
          <div className="avatar w-[15%] lg:w-[6%]">
            <div className="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
            </div>
          </div>
        </div>
        {/* wallet */}
        <div className="mx-2 p-4 w-[95%]  flex justify-center self-center bg-base-300  rounded-lg">
          <div className="flex flex-col items-start w-[60%] ">
            <div>Wallet name</div>
            <Address address={walletAddress ? walletAddress : ""} />
            <div className="text-xs text-info">{targetNetwork.name}</div>
          </div>

          <div className="flex flex-col items-center w-[35%]">
            <div>Balance</div>
            <Balance address={walletAddress ? walletAddress : ""} />
          </div>
        </div>

        {/* actions */}
        <div className="p-3 self-center flex justify-around w-full">
          <div className="m-2 flex flex-col items-center ">
            <ScanIcon width={40} />
            <div className="text-xs">Scan</div>
            <div className="text-xs">QR</div>
          </div>

          <div className="m-2 flex flex-col items-center">
            <PayContactIcon width={40} />
            <div className="text-xs">Pay</div>
            <div className="text-xs">address</div>
          </div>

          <div className="m-2 flex flex-col items-center">
            <ReceiveIcon width={40} />
            <div className="text-xs">Receive</div>
            <div className="text-xs">Base</div>
          </div>

          <div className="m-2 flex flex-col items-center">
            <SaveAddressIcon width={40} />
            <div className="text-xs">Save</div>
            <div className="text-xs">address</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
