"use client";

import { useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";
import { ArrowLeftOnRectangleIcon, ArrowLongLeftIcon as BackIcon } from "@heroicons/react/24/outline";
import { loadBurnerSK, useBurnerWallet } from "~~/hooks/scaffold-eth";

export default function Page({ params }: { params: { address: string } }) {
  const router = useRouter();
  const { account, generateNewBurner } = useBurnerWallet();

  const { address: burnerAddress } = params;
  const burnerPk = loadBurnerSK();

  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>("isLoggedIn", false);

  const onLogout = async () => {
    setIsLoggedIn(false);
    router.push(`/`);
  };

  // useEffect(() => {
  //   if (isLoggedIn === false) {
  //     router.push(`/`);
  //   }
  // }, [isLoggedIn, burnerAddress]);

  return (
    <div className="flex items-center flex-col flex-grow pt-8 w-full lg:w-1/2 lg:ml-[25%]">
      <div className="text-xl font-bold absolute  mr-[65%] flex justify-center items-center">
        <div className="mx-8">
          <BackIcon
            width={30}
            onClick={() => {
              router.back();
            }}
          />
        </div>
        <div className="">Settings</div>
      </div>
      <div className="divider mt-6" />

      <div className="flex justify-between items-center w-full">
        <div className="mx-2 align-bottom">
          <div className="badge badge-primary badge-lg">Base Sepolia</div>
          <div className="text-xs opacity-50">testnet only</div>
        </div>
        <div className="mx-2">
          <button className="btn btn-error btn-outline btn-sm" onClick={onLogout}>
            Logout <ArrowLeftOnRectangleIcon width={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
