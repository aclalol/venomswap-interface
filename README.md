# Venomswap Interface

[comment]: <> (Token1 deployed to: 0x42bcB63175A33adBb5b18F48A18D3FF72f84Ef14)

[comment]: <> (Token2 deployed to: 0xECc97aD9Da46E563aA50D25f6E47900aD774CAF5)

[comment]: <> (RewardToken deployed to: 0xc2f73d61588E1f385B2fc47bd9a25f742499Fd71)

[comment]: <> (SmartChefFactory deployed to: 0xd1c8ddD9D9aeA8F2F8A4F3D56560FD644CC2dC34)

[comment]: <> (Chef1 is: 0x98E25544f61d944cD6AEaBa1ea49282A2AeD1dB5)

[comment]: <> (Chef2 is: 0xaAA23D2BC4C0247c168fF8f7C66d698957A4Fd7D)

[comment]: <> (There are 3 tokens and 2 staking pools)

[comment]: <> (Первые три контракта - просто токены)

[comment]: <> (Четвертый - фабрика пулов, оттуда по ивентам можно как раз их список собрать)

[comment]: <> (Затем два пула. Первый в token1, второй в token2)

[comment]: <> (А reward токен для всех пулов один?)

[comment]: <> (ну в данном случае да, вообще у каждого пула может быть свой)

[![Lint](https://github.com/Uniswap/uniswap-interface/workflows/Lint/badge.svg)](https://github.com/Uniswap/uniswap-interface/actions?query=workflow%3ALint)
[![Tests](https://github.com/Uniswap/uniswap-interface/workflows/Tests/badge.svg)](https://github.com/Uniswap/uniswap-interface/actions?query=workflow%3ATests)
[![Styled With Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

An open source interface for Uniswap -- a protocol for decentralized exchange of Ethereum tokens.

- Website: [uniswap.org](https://uniswap.org/)
- Interface: [app.uniswap.org](https://app.uniswap.org)
- Docs: [uniswap.org/docs/](https://uniswap.org/docs/)
- Twitter: [@UniswapProtocol](https://twitter.com/UniswapProtocol)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- Email: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.gg/FCfyBSbCU5)
- Whitepaper: [Link](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)

## Accessing the Venomswap Interface

To access the Venomswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Uniswap/uniswap-interface/releases/latest), 
or visit [app.uniswap.org](https://app.uniswap.org).

## Listing a token

Please see the
[@venomswap/default-token-list](https://github.com/uniswap/default-token-list) 
repository.

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

### Configuring the environment (optional)

To have the interface default to a different network when a wallet is not connected:

1. Make a copy of `.env` named `.env.local`
2. Change `REACT_APP_NETWORK_ID` to `"{YOUR_NETWORK_ID}"`
3. Change `REACT_APP_NETWORK_URL` to e.g. `"https://{YOUR_NETWORK_ID}.infura.io/v3/{YOUR_INFURA_KEY}"` 

Note that the interface only works on testnets where both 
[Uniswap V2](https://uniswap.org/docs/v2/smart-contracts/factory/) and 
[multicall](https://github.com/makerdao/multicall) are deployed.
The interface will not work on other networks.

## Contributions

**Please open all pull requests against the `master` branch.** 
CI checks will run against all PRs.

