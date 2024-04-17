import { UserOperation } from "userop/dist/v06/entryPoint";
import { toHex, zeroAddress } from "viem";

export const DEFAULT_CALL_GAS_LIMIT = BigInt(200_000);
export const DEFAULT_VERIFICATION_GAS_LIMIT = BigInt(2_000_000); // 2M
export const DEFAULT_PRE_VERIFICATION_GAS = BigInt(80_000); //65000

export const DEFAULT_USER_OP: UserOperation = {
  sender: zeroAddress,
  nonce: BigInt(0),
  initCode: toHex(new Uint8Array(0)),
  callData: toHex(new Uint8Array(0)),
  callGasLimit: DEFAULT_CALL_GAS_LIMIT,
  verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT,
  preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS,
  maxFeePerGas: BigInt(3_000_000_000),
  maxPriorityFeePerGas: BigInt(1_000_000_000),
  paymasterAndData: toHex(new Uint8Array(0)),
  signature: toHex(new Uint8Array(0)),
};

export const ENTRYPOINT_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "callData",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "callGasLimit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "verificationGasLimit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxFeePerGas",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxPriorityFeePerGas",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "paymasterAndData",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct UserOperation",
        name: "userOp",
        type: "tuple",
      },
    ],
    name: "getUserOpHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const BASE_PAY_DATA = "basePay";
