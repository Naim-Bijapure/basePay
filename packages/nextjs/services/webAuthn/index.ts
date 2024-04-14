import {
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  VerifiedRegistrationResponse,
  VerifyRegistrationResponseOpts,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { AuthenticatorDevice } from "@simplewebauthn/typescript-types";

export async function generateRegisterAuth({ rpID, userID, userName }: any) {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: "SimpleWebAuthn Example",
    rpID,
    userID,
    userName,
    timeout: 60000,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
    },
    /**
     * Support the two most common algorithms: ES256, and RS256
     */
    supportedAlgorithmIDs: [-7, -257],
    // extensions: {
    //   //@ts-ignore
    //   largeBlob: {
    //     support: "required",
    //   },
    // },
  };

  const options = await generateRegistrationOptions(opts);
  return { options };
}

export async function verifyAuth({ authResponse, expectedChallenge, expectedOrigin, rpID }: any) {
  const opts: VerifyRegistrationResponseOpts = {
    response: authResponse,
    expectedChallenge: `${expectedChallenge}`,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: true,
  };
  const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse(opts);

  if (verification.verified) {
    //     const { credentialPublicKey, credentialID, counter } = verification.registrationInfo as any;
    //     const newDevice: AuthenticatorDevice = {
    //       credentialPublicKey: credentialPublicKey,
    //       credentialID,
    //       counter,
    //       transports: authResponse.response.transports,
    //     };
    return { verification };
  }

  return { verification: null };
}

export async function generateLoginAuth(option: GenerateAuthenticationOptionsOpts) {
  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    userVerification: "preferred",
    ...option,
    // extensions,
    // allowCredentials,
  };

  const options = await generateAuthenticationOptions(opts);
  return { options };
}
