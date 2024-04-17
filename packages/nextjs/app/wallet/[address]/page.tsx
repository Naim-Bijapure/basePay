"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Address, Balance, BlockieAvatar } from "../../../components/scaffold-eth";
import { base64URLStringToBuffer, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { parseAuthenticatorData } from "@simplewebauthn/server/helpers";
import cbor from "cbor";
import { QRCodeSVG } from "qrcode.react";
import { useLocalStorage } from "usehooks-ts";
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

const MOCK_CONTACTS: any = [
  {
    ens: "atg.eth",
    address: "0x18216371e74C9f1820817131911c243241b56d25",
  },
  {
    ens: "naim.eth",
    address: "0x18216371e74C9f1820817131911c243241b56d25",
  },
  {
    ens: null,
    address: "0x18216371e74C9f1820817131911c243241b56d25",
  },
  {
    ens: "atg.eth",
    address: "0x18216371e74C9f1820817131911c243241b56d26",
  },
  {
    ens: "naim.eth",
    address: "0x18216371e74C9f1820817131911c243241b56d27",
  },
  {
    ens: null,
    address: "0x18216371e74C9f1820817131911c243241b56d28",
  },
];

export default function Page({ params }: { params: { address: string } }) {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();

  // const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [iframeUrl, setIframeUrl] = useState<string>();
  // const [walletContacts, setWalletContacts] = useState<{ ens: string | null; address: string }[]>([...MOCK_CONTACTS]);

  // const [walletName, setWalletName] = useLocalStorage<any>("walletName", "N");
  // const [contacts, setContacts] = useLocalStorage<any[]>("contacts", []);

  let currentWalletData: any = {};
  let isLoggedIn: any = false;
  let contactsLocalStorage = undefined;
  if (typeof window !== "undefined") {
    currentWalletData = JSON.parse(localStorage.getItem("currentWalletData") || "{}");
    isLoggedIn = JSON.parse(localStorage.getItem("isLoggedIn") as any);
    contactsLocalStorage = JSON.parse(localStorage.getItem("contacts") as any);
  }

  const [contacts, setContacts] = useLocalStorage<any[]>(
    "contacts",
    contactsLocalStorage ? [...contactsLocalStorage] : [],
  );
  const { targetNetwork } = useTargetNetwork();

  const { address: walletAddress, buildUserOP } = useBundler({ publicKey: currentWalletData?.pubKey });
  // methods

  // use effects

  useEffect(() => {
    if (Boolean(isLoggedIn) === false) {
      router.push(`/`);
    }
  }, [isLoggedIn]);

  return (
    <>
      <div className="flex flex-col items-start justify-center lg:w-1/2 lg:ml-[25%]">
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
            <div
              className="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
              onClick={() => {
                router.push("/settings");
              }}
            >
              <BlockieAvatar address={walletAddress ? walletAddress : ""} size={16} />
            </div>
          </div>
        </div>
        {/* wallet */}
        <div className="mx-2 p-4 w-[95%]  flex justify-center self-center bg-base-300  rounded-lg">
          <div className="flex flex-col items-start w-[60%] ">
            <div>{currentWalletData ? currentWalletData?.walletName : ""}</div>
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
          <div className="m-2 flex flex-col items-center tooltip tooltip-info" data-tip="coming soon">
            <button className="btn btn-ghost">
              <ScanIcon width={40} />
            </button>
            <div className="text-xs">Scan</div>
            <div className="text-xs">QR</div>
          </div>

          <div className="m-2 flex flex-col items-center">
            <button
              className="btn btn-ghost"
              onClick={() => {
                router.push("/search");
              }}
            >
              <PayContactIcon width={40} />
            </button>
            <div className="text-xs">Pay</div>
            <div className="text-xs">address</div>
          </div>

          <div className="m-2 flex flex-col items-center">
            <button
              className="btn btn-ghost"
              onClick={() => {
                const modal: any = document.getElementById("qr-modal");
                if (modal) {
                  modal.showModal();
                }
              }}
            >
              <ReceiveIcon width={40} />
            </button>
            <div className="text-xs">Receive</div>
            <div className="text-xs">Base</div>
          </div>

          <div className="m-2 flex flex-col items-center">
            <button
              className="btn btn-ghost"
              onClick={() => {
                router.push(`/save`);
              }}
            >
              <SaveAddressIcon width={40} />
            </button>
            <div className="text-xs">Save</div>
            <div className="text-xs">address</div>
          </div>
        </div>

        {/* addresses */}
        <div className="p-3 flex flex-col items-center w-full">
          <div className="text-xl font-bold self-start">Address</div>
          <div className="grid grid-cols-4 gap-8 p-2 ml-2  lg:w-1/2">
            {contacts &&
              contacts.length > 0 &&
              contacts.map((contact, index) => {
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center "
                    onClick={() => {
                      router.push(`/user/${contact.address}`);
                    }}
                  >
                    {/* single avatar */}
                    <div className="avatar">
                      <div className="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <BlockieAvatar address={contact.address} size={16} />
                      </div>
                    </div>

                    <div className="overflow-auto whitespace-normal break-words my-2  text-xs text-gray-400">
                      {contact.ensName ? contact.ensName : contact?.address.slice(0, 7)}
                    </div>
                  </div>
                );
              })}
          </div>
          {/* no address */}
          {contacts && contacts.length == 0 && <div className="badge badge-warning">Send your first payment !</div>}
        </div>

        {/* receive qr scan */}
        {walletAddress && (
          <>
            <dialog id="qr-modal" className="modal">
              <div className="modal-box">
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>

                <div className="flex flex-col items-center">
                  <QRCodeSVG value={walletAddress} size={256} />
                  <div className="m-2">
                    <Address address={walletAddress} format="short" disableAddressLink />
                  </div>
                </div>
              </div>
            </dialog>
          </>
        )}
      </div>
    </>
  );
}
