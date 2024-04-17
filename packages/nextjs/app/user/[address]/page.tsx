"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Address } from "../../../components/scaffold-eth";
import { useLocalStorage } from "usehooks-ts";
import { ArrowLongLeftIcon as BackIcon, ArrowUpRightIcon as ViewTxIcon } from "@heroicons/react/24/outline";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

// const Tx_MOCK_DATA = [
//   {
//     amount: "0.1",
//     date: "2021-10-10 10:10:10",
//     hash: "0xc71dfa63008725e1d9c3a2ca57072cafe20d59fbd204f949862b2db40fb2b321",
//   },
//   {
//     amount: "0.1",
//     date: "2021-10-10 10:10:10",
//     hash: "0xc71dfa63008725e1d9c3a2ca57072cafe20d59fbd204f949862b2db40fb2b321",
//   },
//   {
//     amount: "0.1",
//     date: "2021-10-10 10:10:10",
//     hash: "0xc71dfa63008725e1d9c3a2ca57072cafe20d59fbd204f949862b2db40fb2b321",
//   },
// ];

export default function Page({ params }: { params: { address: string } }) {
  const router = useRouter();
  const { targetNetwork } = useTargetNetwork();

  let usersTxDataLocalStorage = undefined;

  if (typeof window !== "undefined") {
    usersTxDataLocalStorage = JSON.parse(localStorage.getItem("usersTxData") as any);
  }
  const [usersTxData, setUsersTxData] = useLocalStorage<any>(
    "usersTxData",
    usersTxDataLocalStorage ? { ...usersTxDataLocalStorage } : {},
  );
  const ethPrice = useNativeCurrencyPrice();

  const userAddress = String(params.address).slice(0, 10);

  const userTx: any[] = usersTxData[userAddress] ? usersTxData[userAddress] : [];

  return (
    <div className="flex flex-col items-start justify-center h-screen lg:w-1/2 lg:ml-[25%]">
      <div className="w-full">
        <div className="navbar bg-base-100">
          <div className="flex-none">
            <button className="btn btn-square btn-ghost">
              <BackIcon
                width={20}
                onClick={() => {
                  router.back();
                }}
              />
            </button>
          </div>
          <div className="flex-1">
            <Address address={params.address} size="lg" />
          </div>
          <div className="flex-none">
            <button className="btn btn-square btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block w-5 h-5 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {userTx.length === 0 && (
        <div className="self-center absolute">
          <span className="text-gray-400 ">Send your first payment</span>
        </div>
      )}

      <div className="flex-grow self-end w-full overflow-y-auto">
        {userTx.length > 0 && (
          <div className="flex flex-col items-end my-2 w-full- border-2- ">
            {userTx.map((item, index) => (
              <div
                key={index}
                className="m-2  w-1/2"
                onClick={() => {
                  window.open(`${targetNetwork.blockExplorers?.default.url}/op/${item.hash}`, "_blank");
                }}
              >
                <div className="card bg-base-300 shadow-xl">
                  <div className="card-body">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                      <ViewTxIcon width={10} />
                    </button>

                    <div className="text-2xl">${(Number(item?.amount) * ethPrice).toFixed(4)}</div>
                    <div className="text-xs">{Number(item?.amount).toFixed(5)} eth</div>
                    <div className="text-xs text-gray-500">{item.date}</div>
                    <div className="text-xs text-success">Paid</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        <div className="flex justify-end border-t-2  p-2 border-t-gray-600 shadow">
          <button
            className="btn btn-primary btn-md mx-2"
            onClick={() => {
              router.push(`/pay/${params.address}`);
            }}
          >
            Pay
          </button>
          <button className="btn btn-secondary btn-md tooltip tooltip-info" data-tip="coming soon">
            Request
          </button>
        </div>
      </div>
    </div>
  );
}
