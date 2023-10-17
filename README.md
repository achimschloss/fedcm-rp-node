# FedCM Prototyping RP

This is an standalone demonstrator RP implementation that provides basic functionality
for testing a relying party implementation of the [FedCM API](https://fedidcg.github.io/FedCM/).

This is **absolutely** not meant for production use

## Getting Started

To get started:

1. Clone this repository
2. Install node.js and npm
3. Install dependencies

   ```shell
   npm install
   ```

4. Build the project

   ```shell
   npm run build
   ```

5. Run on localhost (defaults to port 7080)

   ```shell
   npm start
   ```

**Note:** The FedCM APIs can be tested using an IDP that runs on a different port on localhost.

## Deployment options

Currently this setup only supports running on localhost or behind a reverse proxy (does not support HTTPS on its own)

## General configuration

### Client/IDPs

Configured via `config/idpConfig.json` - Add an entry to the JSON configuration array (may contain multiple). `configURL` is the FedCM config URL for this IDP, `clientId` the registered clientId for this relying party at the IDP.

Default example with an IDP running on localhost:8080 providing the FedCM configuration via fedcm.son

```json
[
  {
    "configURL": "http://localhost:8080/fedcm.json",
    "clientId": "yourClientID"
  }
]
```

## Supported features

RP:

- Trigger sign-in/sign-up flow with IDP (defaults to On-click, see below)
- Profile page
- Sign-out of RP
- RP side configuration of FedCM API
- Implementation expects
  - navigator.credentials.get API to resolve to a `token` which is a valid JWT signed with a shared secret `xxxxxxx`
  - JWT is expected to contain claims sub (required), email, name and picture

FedCM specifics:

- FedCM [Browser API](https://fedidcg.github.io/FedCM/#browser-api)
- Support for multiple IDPs. A random nonce is automatically added - **Note** that multi-IDP support is not properly working at this time on the browser side.
- Configurable features (via UI) are session specific and can be changed at any given time
  - [Usage Mode](https://github.com/fedidcg/FedCM/issues/442#issuecomment-1675007152) (On-click (mode=Widget), Pageload (mode=Widget), Button (mode=button - Experimental))
  - [Mediation Mode](https://w3c.github.io/webappsec-credential-management/#dom-credentialrequestoptions-mediation) (optional, silent, required, conditional)
  - RP context ([IdentityCredentialRequestOptionsContext](https://fedidcg.github.io/FedCM/#dom-identityprovider-getuserinfo:~:text=IdentityCredentialRequestOptions%2C%20in%20%C2%A7%E2%80%AF2.2.1-,IdentityCredentialRequestOptionsContext,-%2C%20in%20%C2%A7%E2%80%AF2.2.1))
  - [UserInfo API](https://fedidcg.github.io/FedCM/#dom-identityprovider-getuserinfo)
  - Minimal support for different scopes
