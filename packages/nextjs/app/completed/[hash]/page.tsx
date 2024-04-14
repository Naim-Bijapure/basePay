"use client";

import { useRouter } from "next/navigation";
import { XMarkIcon as ClosePayIcon, ArrowUpRightIcon as ViewTxIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export default function Page({ params }: { params: { hash: string } }) {
  const router = useRouter();

  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="flex flex-col items-start h-screen">
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
      <div className="bg-base-200 ">
        <div className="p-6  md:mx-auto">
          <svg viewBox="0 0 24 24" className="text-green-600 w-16 h-16 mx-auto my-6">
            <path
              fill="currentColor"
              d="M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z"
            ></path>
          </svg>
          <div className="text-center">
            <h3 className="md:text-2xl text-base text-gray-900 font-semibold text-center">Payment Done!</h3>
            <p className=" my-2">Thank you for completing your secure online payment.</p>
            <p> Have a great day! </p>
          </div>
        </div>
      </div>

      <div className="self-center">
        <button
          className="btn btn-success"
          onClick={() => {
            window.open(`${targetNetwork.blockExplorers?.default.url}/tx/${params.hash}`, "_blank");
          }}
        >
          View transaction
          <ViewTxIcon width={20} />
        </button>
      </div>
    </div>
  );
}
