# ppx-inject

该项目用于为Profixier的profile自动注入中国IP地址的Direct访问规则.

中国IP地址的范围由程序自动从亚太互联网络信息中心(APNIC)获取, 项目本身不附带IP地址数据库.

## 安装

### 从NPM安装

```powershell
npm install -g ppx-inject
# 或
yarn global add ppx-inject
```

### 从源代码安装

```powershell
git clone git@github.com:BlackGlory/ppx-inject.git
cd ppx-inject
yarn install
yarn global add "file:$(pwd)"
```

## 使用

安装完毕后, 将新增`ppx-inject`命令, 该命令的参数是Proxifier profile文件的路径.

```powershell
ppx-inject .\profile.ppx
```
