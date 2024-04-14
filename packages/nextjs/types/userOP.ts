import { Address, Hex } from "viem";

export type UserOperation = {
  sender: Hex;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
};

export type UserOperationAsHex = {
  sender: Hex;
  nonce: Hex;
  initCode: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  paymasterAndData: Hex;
  signature: Hex;
};
export type Call = {
  dest: Address;
  value: bigint;
  data: Hex;
};

export type UseBundlerType = {
  publicKey: { x: Hex; y: Hex };
};

export type EstimateUserOperationGasReturnType = {
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
};

export type CreateCredential = {
  rawId: Hex;
  pubKey: {
    x: Hex;
    y: Hex;
  };
};

export type P256Credential = {
  rawId: Hex;
  clientData: {
    type: string;
    challenge: string;
    origin: string;
    crossOrigin: boolean;
  };
  authenticatorData: Hex;
  signature: P256Signature;
};

export type P256Signature = {
  r: Hex;
  s: Hex;
};
