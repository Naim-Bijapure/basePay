"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Address, EtherInput } from "../../../components/scaffold-eth";
import { XMarkIcon as ClosePayIcon } from "@heroicons/react/24/outline";

export default function Page({ params }: { params: { address: string } }) {
  const router = useRouter();
  const [amount, setAmount] = useState("0");
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

      <div className="flex-grow self-end"></div>
      <div className="self-center w-full p-4 ">
        <button
          className="btn btn-primary w-full"
          onClick={() => {
            router.push("/completed/0x1234567890abcdef");
          }}
        >
          Pay
        </button>
      </div>
    </div>
  );
}
