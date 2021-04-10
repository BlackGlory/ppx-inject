# ppx-inject

The CLI program that inject Direct access rules into Proxifier's profile.

## Install

```powershell
npm install -g ppx-inject
# or
yarn global add ppx-inject
```

### Install from source

```powershell
git clone git@github.com:BlackGlory/ppx-inject.git
cd ppx-inject
yarn install
yarn build
yarn global add "file:$(pwd)"
```

## Usage

```
Usage: ppx-inject [options] <profile>

The CLI program that inject Direct access rules into Proxifier's profile.

Options:
  -V, --version  output the version number
  --cc <cc...>   ISO 3166 2-letter code of the organization to which the allocation or assignment was made.
  -h, --help     display help for command
```

### Examples

```powershell
npx ppx-inject --cc=CN .\Default.ppx
```
