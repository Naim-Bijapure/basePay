import { ENTRYPOINT_ABI } from "./constants";
import { ECDSASigValue } from "@peculiar/asn1-ecc";
import { AsnParser } from "@peculiar/asn1-schema";
import { base64URLStringToBuffer, startAuthentication } from "@simplewebauthn/browser";
import { GenerateAuthenticationOptionsOpts } from "@simplewebauthn/server";
import { EntryPoint } from "userop/dist/v06";
import {
  Hex,
  createPublicClient,
  encodeAbiParameters,
  encodePacked,
  getContract,
  http,
  toHex,
  zeroAddress,
} from "viem";
import scaffoldConfig from "~~/scaffold.config";
import { generateLoginAuth } from "~~/services/webAuthn";
import {
  EstimateUserOperationGasReturnType,
  P256Credential,
  P256Signature,
  UserOperation,
  UserOperationAsHex,
} from "~~/types/userOP";

export const relayer = "0x18216371e74C9f1820817131911c243241b56d25"; // any random address
export const ENTRYPOINT_ADDRESS: Hex = EntryPoint.DEFAULT_ADDRESS;

// public  clients
export const publicClient = createPublicClient({
  chain: scaffoldConfig.targetNetworks[0],
  transport: http(),
});
const stackUpBundlerRpcUrl = http(`https://api.stackup.sh/v1/node/${process.env.NEXT_PUBLIC_STACKUP_BUNDLER_API_KEY}`);

export const publicClientStackUp = createPublicClient({
  chain: scaffoldConfig.targetNetworks[0],
  transport: stackUpBundlerRpcUrl,
});

export async function estimateUserOperationGas(args: {
  userOp: UserOperationAsHex;
}): Promise<EstimateUserOperationGasReturnType> {
  return await publicClientStackUp.request({
    method: "eth_estimateUserOperationGas" as any,
    params: [{ ...args.userOp }, ENTRYPOINT_ADDRESS],
  });
}

export function toParams(op: UserOperation): UserOperationAsHex {
  return {
    sender: op.sender,
    nonce: toHex(op.nonce),
    initCode: op.initCode,
    callData: op.callData,
    callGasLimit: toHex(op.callGasLimit),
    verificationGasLimit: toHex(op.verificationGasLimit),
    preVerificationGas: toHex(op.preVerificationGas),
    maxFeePerGas: toHex(op.maxFeePerGas),
    maxPriorityFeePerGas: toHex(op.maxPriorityFeePerGas),
    paymasterAndData: op.paymasterAndData === zeroAddress ? "0x" : op.paymasterAndData,
    signature: op.signature,
  };
}

export async function getUserOpHash(userOp: UserOperation): Promise<Hex> {
  const entryPointContract = getContract({
    address: EntryPoint.DEFAULT_ADDRESS,
    abi: ENTRYPOINT_ABI,
    publicClient: publicClient,
  });

  const userOpHash = entryPointContract.read.getUserOpHash([userOp]);
  return userOpHash;
}

export async function getSignature(msgToSign: Hex, keyId: Hex): Promise<Hex> {
  //   const credentials: P256Credential = (await WebAuthn.get(msgToSign)) as P256Credential;
  const credentials = await signWebAuthn(msgToSign);

  console.log(`n-🔴 => getSignature => credentials?.rawId:`, credentials?.rawId);
  if (credentials?.rawId !== keyId) {
    throw new Error(
      "Incorrect passkeys used for tx signing. Please sign the transaction with the correct logged-in account",
    );
  }

  const signature = encodePacked(
    ["uint8", "uint48", "bytes"],
    [
      1,
      0,
      encodeAbiParameters(
        [
          {
            type: "tuple",
            name: "credentials",
            components: [
              {
                name: "authenticatorData",
                type: "bytes",
              },
              {
                name: "clientDataJSON",
                type: "string",
              },
              {
                name: "challengeLocation",
                type: "uint256",
              },
              {
                name: "responseTypeLocation",
                type: "uint256",
              },
              {
                name: "r",
                type: "bytes32",
              },
              {
                name: "s",
                type: "bytes32",
              },
            ],
          },
        ],
        [
          {
            authenticatorData: credentials?.authenticatorData,
            clientDataJSON: JSON.stringify(credentials?.clientData),
            challengeLocation: BigInt(23),
            responseTypeLocation: BigInt(1),
            r: credentials.signature.r,
            s: credentials.signature.s,
          },
        ],
      ),
    ],
  );

  return signature;
}

export async function signWebAuthn(challenge?: Hex): Promise<P256Credential | null> {
  const loginAuthData: GenerateAuthenticationOptionsOpts = {
    rpID: window.location.hostname,
    challenge: challenge
      ? Buffer.from(challenge.slice(2), "hex")
      : Uint8Array.from("random-challenge", c => c.charCodeAt(0)),
    timeout: 60000,
    userVerification: "preferred",
  };

  const { options } = await generateLoginAuth({ ...loginAuthData });

  const credential = await startAuthentication({
    ...options,
  });

  if (!credential) {
    return null;
  }

  const cred = credential as unknown as {
    rawId: ArrayBuffer;
    response: {
      clientDataJSON: ArrayBuffer;
      authenticatorData: ArrayBuffer;
      signature: ArrayBuffer;
      userHandle: ArrayBuffer;
    };
  };

  const utf8Decoder = new TextDecoder("utf-8");

  const decodedClientData = utf8Decoder.decode(base64URLStringToBuffer(cred.response.clientDataJSON as any));
  const clientDataObj = JSON.parse(decodedClientData);
  console.log(`n-🔴 => signWebAuthn => clientDataObj:`, clientDataObj);

  const authenticatorData = toHex(new Uint8Array(base64URLStringToBuffer(cred.response.authenticatorData as any)));
  const signature = parseSignature(new Uint8Array(base64URLStringToBuffer(cred?.response?.signature as any)));

  return {
    rawId: toHex(new Uint8Array(base64URLStringToBuffer(cred.rawId as any))),
    clientData: {
      type: clientDataObj.type,
      challenge: clientDataObj.challenge,
      origin: clientDataObj.origin,
      crossOrigin: clientDataObj.crossOrigin,
    },
    authenticatorData,
    signature,
  };
}

export function shouldRemoveLeadingZero(bytes: Uint8Array): boolean {
  return bytes[0] === 0x0 && (bytes[1] & (1 << 7)) !== 0;
}
export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let pointer = 0;
  const totalLength = arrays.reduce((prev, curr) => prev + curr.length, 0);

  const toReturn = new Uint8Array(totalLength);

  arrays.forEach(arr => {
    toReturn.set(arr, pointer);
    pointer += arr.length;
  });

  return toReturn;
}

export function parseSignature(signature: Uint8Array): P256Signature {
  const parsedSignature = AsnParser.parse(signature, ECDSASigValue);
  let rBytes = new Uint8Array(parsedSignature.r);
  let sBytes = new Uint8Array(parsedSignature.s);
  if (shouldRemoveLeadingZero(rBytes)) {
    rBytes = rBytes.slice(1);
  }
  if (shouldRemoveLeadingZero(sBytes)) {
    sBytes = sBytes.slice(1);
  }
  const finalSignature = concatUint8Arrays([rBytes, sBytes]);
  return {
    r: toHex(finalSignature.slice(0, 32)),
    s: toHex(finalSignature.slice(32)),
  };
}

export const emptyHex = toHex(new Uint8Array(0));
