# ppx-inject

该项目用于为Profixier的profile自动注入中国IP地址的Direct访问规则.

中国IP地址的范围由程序自动从亚太互联网络信息中心(APNIC)获取, 项目本身不附带IP地址数据库.

## 安装

```sh
npm install -g ppx-inject
# 或
yarn global add ppx-inject
```

## 使用

安装完毕后, 将新增`ppx-inject`命令, 该命令的参数是Proxifier profile文件的路径.

```sh
ppx-inject profile.ppx
```

`ppx-inject`不会直接修改ppx文件, 而是在内存合并出新的profile后启动一次性HTTP服务器, 用户需要在Profixier的Profile Auto Update功能里使用命令输出的URL地址以single profile file的形式完成手动更新(这是运行时更新Proxifier profile的最佳方式).
