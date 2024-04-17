"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Address, isENS } from "../../components/scaffold-eth";
import { useDebounceValue, useLocalStorage } from "usehooks-ts";
import { isAddress } from "viem";
import { ArrowLongLeftIcon as BackIcon } from "@heroicons/react/24/outline";
import { publicClientMainnet } from "~~/utils/scaffold-eth/userOP";

// const MOCK_DATA = [
//   {
//     address: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
//     ensName: "atg.eth",
//   },
//   {
//     address: "0x18216371e74C9f1820817131911c243241b56d26",
//     ensName: "mock.eth",
//   },
//   {
//     address: "0x18216371e74C9f1820817131911c243241b56d25",
//     ensName: "mock.eth",
//   },
// ];

export default function Search() {
  const router = useRouter();
  // const [addresses, setAddresses] = useState<{ address: string; ensName: string }[]>([...MOCK_DATA]);
  let contactsLocalStorage = undefined;
  if (typeof window !== "undefined") {
    contactsLocalStorage = JSON.parse(localStorage.getItem("contacts") as any);
  }

  const [contacts, setContacts] = useLocalStorage<any[]>(
    "contacts",
    contactsLocalStorage ? [...contactsLocalStorage] : [],
  );
  const [searched, setSearched] = useState<string>();
  const [matchedContacts, setMatchedContacts] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [searchedDebounce] = useDebounceValue(searched, 1000);

  // methods
  const findContact = async (searched: string) => {
    setIsLoading(true);
    const lowercasedSearched = searched.toLowerCase();
    let matchedContacts: any = undefined;
    if (isAddress(searched)) {
      matchedContacts = contacts.filter(contact => contact.address.toLowerCase().includes(lowercasedSearched));
    }
    if (!isAddress(searched)) {
      matchedContacts = contacts.filter(contact => contact?.ensName?.toLowerCase().includes(lowercasedSearched));
    }

    if (matchedContacts && matchedContacts?.length > 0) {
      setMatchedContacts([...matchedContacts]);
    }

    if (matchedContacts && matchedContacts?.length === 0) {
      setMatchedContacts([]);

      // if searched term a ens
      if (isENS(searched)) {
        try {
          // resolve ENS
          const address = await publicClientMainnet.getEnsAddress({ name: searched });
          if (address) {
            setMatchedContacts([{ address, ensName: searched }]);
            setContacts([...contacts, { address, ensName: searched }]);
          }
        } catch (error) {}
      }

      // if searched term a address
      if (isAddress(searched)) {
        try {
          setMatchedContacts([{ address: searched, ensName: null }]);
          setContacts([...contacts, { address: searched, ensName: null }]);
        } catch (error) {}
      }
    }

    setIsLoading(false);
  };

  // use effects
  useEffect(() => {
    if (Boolean(searchedDebounce)) {
      findContact(searchedDebounce as string);
    }
  }, [searchedDebounce]);

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
            placeholder="Search or enter new address"
            value={searched ? searched : ""}
            onChange={element => {
              setSearched(element.currentTarget.value);
            }}
          />
        </label>
      </div>
      {/* loading */}
      {isLoading && (
        <>
          <div className="w-full py-5 ml-5">
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
          </div>
        </>
      )}
      {matchedContacts && matchedContacts.length > 0 && (
        <div className="self-start m-5 text-xl text-gray-200 lg:ml-[25%]">Searched</div>
      )}
      {matchedContacts && matchedContacts.length > 0 && (
        <div className="flex flex-col items-start self-start ml-5 lg:ml-[25%]">
          {matchedContacts.map((item: any) => (
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

      <div className="self-start m-5 text-xl text-gray-200 lg:ml-[25%]">Recent</div>
      {contacts.length > 0 && (
        <div className="flex flex-col items-start self-start ml-5 lg:ml-[25%]">
          {contacts.map(item => (
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
