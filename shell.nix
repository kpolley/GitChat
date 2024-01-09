{ pkgs ? import <nixpkgs> {} }:

let
  NPM_CONFIG_PREFIX = toString ./npm_config_prefix;
in pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.nodePackages.pnpm
    pkgs.nodePackages.ts-node
    pkgs.nodePackages.vercel
    pkgs.nodePackages.prettier
    pkgs.google-cloud-sdk
  ];

  shellHook = ''
    export PATH=${NPM_CONFIG_PREFIX}/bin:$PATH
  '';
}
