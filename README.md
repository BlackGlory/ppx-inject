# ppx-inject
The CLI program that inject Direct access rules into Proxifier's profile.

## Install
```powershell
npm install --global ppx-inject
# or
yarn global add ppx-inject
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

Example:
```powershell
ppx-inject --cc=CN --cc=HK --cc=MO .\Default.ppx
```
