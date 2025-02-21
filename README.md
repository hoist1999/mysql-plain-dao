# mysql-plain-dao
A tool for generating data model objects from an existing MySQL database. It also comes with a library of tools to simplify database access. Only supports typescript.


## 

## Inspired by:
https://github.com/SweetIQ/schemats


## Usage

```bash
npx mysql-plain-dao generate -c mysql://root:123456@localhost:3306/test -t user -s public -o user.ts
```


# 测试
BaseDAO的测试，请查看role.test.ts，已经包括了增删改查功能。




# todo
DbUtil中直接加载了.env
需要解开