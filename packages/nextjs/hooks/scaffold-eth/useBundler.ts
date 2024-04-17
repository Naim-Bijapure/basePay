import { useEffect, useRef, useState } from "react";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useScaffoldContractRead } from "./useScaffoldContractRead";
import { V06 } from "userop";
import { UserOperation } from "userop/dist/v06/entryPoint";
import { Hex, encodeFunctionData, encodePacked, parseAbi, toHex } from "viem";
import scaffoldConfig from "~~/scaffold.config";
import { Call, UseBundlerType, UserOperationAsHex } from "~~/types/userOP";
import { DEFAULT_USER_OP } from "~~/utils/scaffold-eth/constants";
import {
  ENTRYPOINT_ADDRESS,
  estimateUserOperationGas,
  getSignature,
  publicClient,
  relayer,
  toParams,
} from "~~/utils/scaffold-eth/userOP";

interface BuildUserOPParams {
  calls: Call[];
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  keyId: Hex;
}
type BuildUserOPFunction = (params: BuildUserOPParams) => Promise<UserOperation>;

export type BundlerType = {
  address: string | null;
  initCode: Hex;
  initCodeGas: Hex;
  buildUserOP: BuildUserOPFunction;
  calculateWalletAddress: (pubKey: readonly [Hex, Hex]) => Promise<Hex | undefined>;
};

export const useBundler = ({ publicKey }: UseBundlerType): BundlerType => {
  const initCodeRef = useRef<any>();
  const initCodeGasRef = useRef<any>();
  const nonceRef = useRef<any>();

  // scaffold hooks
  const { data: simpleAccountFactoryData } = useDeployedContractInfo("SimpleAccountFactory");

  const { data: walletAddress } = useScaffoldContractRead({
    contractName: "SimpleAccountFactory",
    functionName: "getAddress",
    args: [[publicKey?.x, publicKey?.y]],
  });

  // methods
  const _getNonce = async (smartWalletAddress: Hex): Promise<bigint> => {
    const nonce: bigint = await publicClient.readContract({
      address: ENTRYPOINT_ADDRESS,
      abi: parseAbi(["function getNonce(address, uint192) view returns (uint256)"]),
      functionName: "getNonce",
      args: [smartWalletAddress, BigInt(0)],
    });
    return nonce;
  };

  const _createInitCode = async (pubKey: readonly [Hex, Hex]): Promise<{ initCode: Hex; initCodeGas: bigint }> => {
    let createAccountTx = undefined;
    if (pubKey) {
      createAccountTx = encodeFunctionData({
        abi: simpleAccountFactoryData?.abi as any,
        functionName: "createAccount",
        args: [pubKey],
      });
    }

    const initCode = encodePacked(
      ["address", "bytes"], // types
      [simpleAccountFactoryData?.address as string, createAccountTx as any], // values
    );

    const initCodeGas = await publicClient.estimateGas({
      account: relayer,
      to: simpleAccountFactoryData?.address as string,
      data: createAccountTx,
    });

    return {
      initCode,
      initCodeGas,
    };
  };

  const fetchWalletInits = async (address: string) => {
    try {
      const byteCode = await publicClient.getBytecode({ address });
      // const initCodeGas = BigInt(0);
      if (byteCode !== undefined) {
        // initCodeRef.current = byteCode as any;
        // initCodeGasRef.current = initCodeGas;

        initCodeRef.current = toHex(new Uint8Array(0));
        initCodeGasRef.current = BigInt(0);
      }

      if (byteCode === undefined) {
        const { initCode, initCodeGas } = await _createInitCode([publicKey.x, publicKey.y]);
        initCodeRef.current = initCode as any;
        initCodeGasRef.current = initCodeGas;
      }

      const nonce = await _getNonce(walletAddress as Hex);
      // setNonce(nonce);
      nonceRef.current = nonce;
    } catch (error) {
      console.error("Error fetching wallet inits", error);
    }
  };
  const _addCallData = (calls: Call[]): Hex => {
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            {
              components: [
                {
                  internalType: "address",
                  name: "dest",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "value",
                  type: "uint256",
                },
                {
                  internalType: "bytes",
                  name: "data",
                  type: "bytes",
                },
              ],
              internalType: "struct Call[]",
              name: "calls",
              type: "tuple[]",
            },
          ],
          name: "executeBatch",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "executeBatch",
      args: [calls],
    });
  };

  const buildUserOP = async ({
    calls,
    maxFeePerGas,
    maxPriorityFeePerGas,
    keyId,
  }: {
    calls: Call[];
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    keyId: Hex;
  }): Promise<UserOperationAsHex> => {
    try {
      // create callData

      const callData = _addCallData(calls);

      // create user operation
      const userOp: UserOperation = {
        ...DEFAULT_USER_OP,
        sender: walletAddress as Hex,
        nonce: nonceRef.current,
        initCode: initCodeRef.current,
        callData,
        maxFeePerGas,
        maxPriorityFeePerGas,
      };

      const { callGasLimit, verificationGasLimit, preVerificationGas } = await estimateUserOperationGas({
        userOp: toParams(userOp),
      });

      // set gas limits with the estimated values + some extra gas for safety
      userOp.callGasLimit = BigInt(callGasLimit);
      userOp.preVerificationGas = BigInt(preVerificationGas) * BigInt(10);
      const initCodeGas = initCodeGasRef.current;
      userOp.verificationGasLimit =
        BigInt(verificationGasLimit) + BigInt(150_000) + BigInt(initCodeGas) + BigInt(1_000_000);

      // const userOpHash = await getUserOpHash(userOp);

      // get userOp hash (with signature == 0x) by calling the entry point contract
      const userOpHash = V06.EntryPoint.calculateUserOpHash(
        userOp,
        V06.EntryPoint.DEFAULT_ADDRESS,
        scaffoldConfig.targetNetworks[0].id,
      );
      // version = 1 and validUntil = 0 in msgToSign are hardcoded
      const msgToSign = encodePacked(["uint8", "uint48", "bytes32"], [1, 0, userOpHash]);
      const signature = await getSignature(msgToSign, keyId);

      console.log(`n-🔴 => useBundler => userOP`, toParams({ ...userOp, signature }));
      return toParams({ ...userOp, signature });
    } catch (error: any) {
      console.error("Error fetching wallet inits", error);
      return error;
    }
  };

  const calculateWalletAddress = async (pubKey: readonly [Hex, Hex]): Promise<Hex | undefined> => {
    if (simpleAccountFactoryData?.address) {
      const address = await publicClient.readContract({
        address: simpleAccountFactoryData?.address,
        abi: simpleAccountFactoryData?.abi,
        functionName: "getAddress",
        args: [[...(pubKey as any)]] as any,
      });
      return address as Hex;
    }
    return undefined;
  };

  // use effects
  useEffect(() => {
    if (walletAddress && simpleAccountFactoryData?.address) {
      fetchWalletInits(walletAddress);
    }
  }, [walletAddress, simpleAccountFactoryData]);
  return {
    address: walletAddress ? walletAddress : null,
    initCode: initCodeRef.current,
    initCodeGas: initCodeGasRef.current,
    buildUserOP,
    calculateWalletAddress,
  };
};
