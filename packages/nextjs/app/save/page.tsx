"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput, isENS } from "../../components/scaffold-eth";
import { a } from "@upstash/redis/zmscore-07021e27";
import { useLocalStorage } from "usehooks-ts";
import { isAddress } from "viem";
import { ArrowLongLeftIcon as BackIcon } from "@heroicons/react/24/outline";
import { notification } from "~~/utils/scaffold-eth";
import { publicClientMainnet } from "~~/utils/scaffold-eth/userOP";

export default function Page() {
  const router = useRouter();
  const [address, setAddress] = useState<string>();

  let contactsLocalStorage = undefined;
  if (typeof window !== "undefined") {
    contactsLocalStorage = JSON.parse(localStorage.getItem("contacts") as any);
  }

  const [contacts, setContacts] = useLocalStorage<any[]>(
    "contacts",
    contactsLocalStorage ? [...contactsLocalStorage] : [],
  );

  const saveAddress = async () => {
    const ensName = await publicClientMainnet.getEnsName({ address: address as string });
    console.log(`n-🔴 => saveAddress => ensName:`, ensName);
    setContacts([...contacts, { address, ensName }]);
    notification.success("address saved !");
    setAddress("");
  };

  return (
    <div className="flex items-center flex-col flex-grow  w-full lg:w-1/2 lg:ml-[25%]">
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
          <div className="flex-1">Save address</div>
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

      <div className="flex  justify-center items-center flex-col w-full m-2">
        <div className="p-4 ">
          <AddressInput value={address ? address : ""} onChange={setAddress} placeholder="Enter new address" />
        </div>
        <div className="w-full p-4">
          <button className="btn btn-primary  w-full" onClick={saveAddress}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
