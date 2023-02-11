{
  inputs = {
    nixpkgs.url      = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url  = "github:numtide/flake-utils";
  };

  description = "A simple Discord bot that plays a theme for users joining a voice channel.";

  outputs = { self, nixpkgs, flake-utils }: 
    flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs {
        inherit system;
      };
      src = ./.;
      yarnPackage = with pkgs; mkYarnPackage {
        inherit src;

        name = "memejoin";
        packageJSON = ./package.json;
        yarnLock = ./yarn.lock;
      };
      memejoin = pkgs.stdenv.mkDerivation rec {
        name = "memejoin";
        src = yarnPackage;

        installPhase = ''
          mkdir -p $out

          sed -i '1i#!/usr/bin/env node' bin/memejoin
          chmod +x bin/memejoin

          cp -R ./* $out
        '';
      };
    in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [ nodejs yarn yarn2nix python3 gnumake gcc ];
        };

        packages = with pkgs; flake-utils.lib.flattenTree {
          default = buildFHSUserEnv rec {
            name = "memejoin";
            targetPkgs = pkgs: (with pkgs; [ nodejs yarnPackage ffmpeg opusTools ]);
            runScript = "node ${yarnPackage.outPath}/bin/memejoin";

            #extraInstallCommands = ''
            #  sed -i '1i#!/usr/bin/env node' bin/memejoin

            #  mkdir -p $out/bin
            #  cat <<EOF > start.sh
            #  node ${yarnPackage.outPath}/bin/memejoin
            #  EOF

            #  cp start.sh $out/bin
            #'';
          };
        };
      }
    );
}
