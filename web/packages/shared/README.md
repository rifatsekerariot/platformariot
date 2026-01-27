# @milesight/shared

In Monorepo, we usually have multiple applications and multiple dependent sub-libraries, there will be code reuse between applications and sub-libraries, and we hope that this part of reusable code can be referenced in the repo without building and compiling, in order to make full use of Tree Shaking, and at the same time to reduce the build time and improve the development efficiency. Therefore, we extract this part of the code as an independent `shared` sub-library, and introduce the corresponding module in the `shared` library when referencing it in each sub-library of the repo as needed.

## Directory structure

```
.
├── src
│   ├── components      # Universal Components
│   ├── config          # Universal Configs
│   ├── hooks           # Universal Hooks
│   ├── services        # Universal Services
│   ├── store           # Universal Store
│   ├── styles          # Common Styles
│   └── utils           # Universal Utils
│
├── types               # Common Types
├── README.md
├── package.json
└── tsconfig.json
```
