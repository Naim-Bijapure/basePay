"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Address } from "../../components/scaffold-eth";
import { ArrowLongLeftIcon as BackIcon } from "@heroicons/react/24/outline";

const MOCK_DATA = [
  {
    address: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    ensName: "atg.eth",
  },
  {
    address: "0x18216371e74C9f1820817131911c243241b56d26",
    ensName: "mock.eth",
  },
  {
    address: "0x18216371e74C9f1820817131911c243241b56d25",
    ensName: "mock.eth",
  },
];

export default function Search() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<{ address: string; ensName: string }[]>([...MOCK_DATA]);

  return (
    <div className="p-3 flex flex-col justify-center  items-center">
      {/* search bar */}
      <div className="lg:w-[50%]">
        <label className="input input-bordered flex items-center gap-2 ">
          <BackIcon
            width={20}
            onClick={() => {
              router.back();
            }}
          />
          <input
            type="text"
            className="grow w-[50%] bg-base-100"
            placeholder="Search"
            onFocus={() => {
              // setIsSearch(true);
            }}
          />
        </label>
      </div>
      {/* loading */}
      {/* <div className="w-full py-5 ml-5">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center ">
            <div className="skeleton w-16 h-16 rounded-full shrink-0"></div>
            <div className="flex flex-col gap-4">
              <div className="skeleton h-4 w-46"></div>
              <div className="skeleton h-4 w-44"></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 my-2">
          <div className="flex gap-4 items-center ">
            <div className="skeleton w-16 h-16 rounded-full shrink-0"></div>
            <div className="flex flex-col gap-4">
              <div className="skeleton h-4 w-46"></div>
              <div className="skeleton h-4 w-44"></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center ">
            <div className="skeleton w-16 h-16 rounded-full shrink-0"></div>
            <div className="flex flex-col gap-4">
              <div className="skeleton h-4 w-46"></div>
              <div className="skeleton h-4 w-44"></div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="self-start m-5 text-xl text-gray-200 lg:ml-[25%]">Recent</div>
      {addresses.length > 0 && (
        <div className="flex flex-col items-start self-start ml-5 lg:ml-[25%]">
          {addresses.map(item => (
            <div key={item.address} className="p-2">
              <div
                onClick={() => {
                  router.push(`/user/${item.address}`);
                }}
              >
                <Address address={item.address} size="xl" disableAddressLink />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
