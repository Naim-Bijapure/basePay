"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Address, EtherInput } from "../../../components/scaffold-eth";
import { Balance } from "../../../components/scaffold-eth";
import { useLocalStorage } from "usehooks-ts";
import { V06 } from "userop";
import { Hex, parseEther } from "viem";
import { XMarkIcon as ClosePayIcon } from "@heroicons/react/24/outline";
import { useBundler } from "~~/hooks/scaffold-eth/useBundler";
import { emptyHex, publicClientStackUp } from "~~/utils/scaffold-eth/userOP";

export default function Page({ params }: { params: { address: string } }) {
  const router = useRouter();
  const [amount, setAmount] = useState("0");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  let currentWalletData = undefined;
  let usersTxDataLocalStorage = undefined;
  if (typeof window !== "undefined") {
    currentWalletData = JSON.parse(localStorage.getItem("currentWalletData") as any);
    usersTxDataLocalStorage = JSON.parse(localStorage.getItem("usersTxData") as any);
  }

  const [usersTxData, setUsersTxData] = useLocalStorage<any>(
    "usersTxData",
    usersTxDataLocalStorage ? { ...usersTxDataLocalStorage } : {},
  );

  const { address: walletAddress, buildUserOP } = useBundler({ publicKey: currentWalletData?.pubKey });
  const destinationAddress = params.address.toLowerCase() as Hex;

  const onPay = async () => {
    try {
      setIsProcessing(true);
      const { maxFeePerGas, maxPriorityFeePerGas } = await publicClientStackUp.estimateFeesPerGas();
      const userOp = await buildUserOP({
        calls: [
          {
            dest: destinationAddress,
            value: parseEther(amount as string),
            data: emptyHex,
          },
        ],
        maxFeePerGas: maxFeePerGas as bigint,
        maxPriorityFeePerGas: maxPriorityFeePerGas as bigint,
        keyId: currentWalletData?.rawId as Hex,
      });
      const userOpHash = await V06.Bundler.SendUserOperationWithEthClient(
        userOp,
        V06.EntryPoint.DEFAULT_ADDRESS,
        publicClientStackUp as any,
      );
      // const receipt = await V06.Bundler.GetUserOperationReceiptWithEthClient(userOpHash, publicClientStackUp as any);
      setIsProcessing(false);

      const userTxs: any[] = usersTxData[destinationAddress.slice(0, 10).toLowerCase()]
        ? usersTxData[destinationAddress.slice(0, 10).toLowerCase()]
        : [];
      userTxs.push({
        amount: amount,
        date: new Date().toLocaleDateString(),
        hash: userOpHash,
      });

      setUsersTxData({ [destinationAddress.slice(0, 10).toLowerCase()]: [...userTxs] });
      router.push(`/completed/${userOpHash}`);
    } catch (error) {
      setIsProcessing(false);
      setIsFailed(true);
      console.error("payment error", error);
    }
  };

  return (
    <div className="flex flex-col items-start h-screen lg:w-1/2 lg:ml-[25%]">
      <div>
        <button
          className="btn btn-sm btn-circle btn-ghost m-5"
          onClick={() => {
            router.back();
          }}
        >
          <ClosePayIcon width={30} />
        </button>
      </div>
      <div className="self-center flex flex-col items-center">
        <div className="text-gray-300">Paying</div>
        <Address address={params.address} size="lg" />
        <div className="my-8 w-[60%] scale-150">
          <EtherInput
            value={amount}
            onChange={value => {
              setAmount(value);
            }}
          />
        </div>
      </div>

      <div className="flex-grow self-center">
        {isProcessing && (
          <div className="flex flex-col items-center my-[50%]">
            <span className="loading loading-ring loading-lg bg-primary"></span>
            <div className="text-sm text-accent my-1">Hold on sending...</div>
          </div>
        )}
        {isFailed && (
          <>
            <div className="flex flex-col justify-center items-center">
              <div>
                <svg
                  className="w-[100%]  text-error "
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="240"
                  height="240"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <div className="text-xs text-error">Transaction failed </div>
              <div className="text-xs text-error"> please check you have enough balance</div>
            </div>
          </>
        )}
      </div>
      <div className="self-center w-full p-4 flex flex-col items-start">
        <div className="flex justify-start items-center mx-4 w-full">
          <div className="text-gray-400">Balance</div>
          <Balance address={walletAddress ? walletAddress : ""} />
        </div>
        <button className="btn btn-primary w-full" onClick={onPay} disabled={isProcessing}>
          Pay
        </button>
      </div>
    </div>
  );
}
