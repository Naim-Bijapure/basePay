"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Address } from "../../../components/scaffold-eth";
import { ArrowLongLeftIcon as BackIcon, ArrowUpRightIcon as ViewTxIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

const Tx_MOCK_DATA = [
  {
    amount: "0.1",
    date: "2021-10-10 10:10:10",
    hash: "0xc71dfa63008725e1d9c3a2ca57072cafe20d59fbd204f949862b2db40fb2b321",
  },
  {
    amount: "0.1",
    date: "2021-10-10 10:10:10",
    hash: "0xc71dfa63008725e1d9c3a2ca57072cafe20d59fbd204f949862b2db40fb2b321",
  },
  {
    amount: "0.1",
    date: "2021-10-10 10:10:10",
    hash: "0xc71dfa63008725e1d9c3a2ca57072cafe20d59fbd204f949862b2db40fb2b321",
  },
];

export default function Page({ params }: { params: { address: string } }) {
  const router = useRouter();
  const [userTx, setUserTx] = useState<{ amount: string; date: string; hash: string }[]>([...Tx_MOCK_DATA]);

  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="flex flex-col items-start justify-center h-screen">
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
      <div className="flex-grow self-end">
        {userTx && (
          <div className="flex flex-col items-end my-2 ">
            {userTx.map((item, index) => (
              <div
                key={index}
                className="m-2"
                onClick={() => {
                  window.open(`${targetNetwork.blockExplorers?.default.url}/tx/${item.hash}`, "_blank");
                }}
              >
                <div className="card bg-base-300 shadow-xl">
                  <div className="card-body">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                      <ViewTxIcon width={10} />
                    </button>

                    {/* <button className="btn btn-xs btn-primary"></button> */}
                    <div className="text-xl">{item.amount} eth</div>
                    <div className="text-xs">{item.date}</div>
                    <div className="text-xs text-success">paid</div>
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
            className="btn btn-primary btn-sm mx-2"
            onClick={() => {
              router.push(`/pay/${params.address}`);
            }}
          >
            Pay
          </button>
          <button className="btn btn-secondary btn-sm tooltip tooltip-info" data-tip="coming soon">
            Request
          </button>
        </div>
      </div>
    </div>
  );
}
