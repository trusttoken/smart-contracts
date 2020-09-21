/**
 * ts-node scripts/convert_checksum_addresses.ts
 */
import { ethers } from 'ethers'

async function convertChecksumAddresses () {
  const addresses = [
    '0x52394d5123d74f23e513df6f13810d8c811ec5d3',
    '0x9d25a009dfb6318bbb8fcb91ff197840cb4a4a01',
    '0x222e5ebdf15ded06bdbdbe5944ef9cd10e04c84d',
    '0x27b6b4e6b2400b30c1595f342d3d9ff46fd8b7a3',
    '0x399e3a8fddbcaa27320ffb99470c3dfc4ba86042',
    '0xbbcf00b7bef1300e3dda86528a302ae8e80d52f0',
    '0x8890894cefdb54116993f09b2d51c379e6b8952c',
    '0x631e6fc833e65664dbfc5b20c7589e0f779aa473',
    '0x3181adf8929a3c4d81c7eeecdbfb14c7c948536c',
    '0x65116c853f1c34fde1e8a6bdb87c6ea78c640d7c',
    '0x1adafa58156ecd0848be1efa9112b3cfc62de07f',
    '0x426eb66769165b919e635f5d956a76e33ff6b75a',
    '0x164f25bbaa2e4b522a6b17a20853d002817eab16',
    '0xdc8bb0e967ac3437572588ab3e8fdfbca11e0045',
    '0x1ddb6dd047bad7b4354aa051544794505caa80bf',
    '0x61b4c5ac588717379531c099118b5439e7938041',
    '0x3038e4c8fd9b7f379cbdc3dd5c1b4ec85870ddb6',
    '0x8a178456af9b1d90328069b20d6db416f350eacc',
    '0xfc548c168da1d9bbc5b899e8d3ee67b5cb27ba4c',
    '0x99f97a87073fb21d6e83442143d3ebf572a5f418',
    '0x33cd051be5004929d750f4e9a5bb741caf3aa76e',
    '0xe75a96f41b84144f095029263c2e81679f6830f2',
    '0x9826f14289bbe7f3061506d366c5f48ff3947b2a',
    '0xeeb4efb0884aef8fd55204caaed2ef19bd383ca8',
    '0xffd5a9b87498b37538233f6323ea455ff7d30993',
    '0x65efe1704deb45ef9b03436ba9dda24c274f54cb',
    '0x6b40a8dfaa85083b4a8192f8bbd9ca5ae138babd',
    '0x00003012c2d2aa32aa39ea82e96c792b56ee6f88',
    '0x938c7af92edc470f05c6481db73cc0aa521ae0e4',
    '0xa0ad36b6083d2a553da3aa78581c048ca63d3873',
    '0xb46bdc09403b5271c816228f65912342ba32fe3f',
    '0x38586444200e0dc6938c8d258fb15fd14eb619b8',
    '0x02f665b3c8352c602430a41af018ab28a46e2680',
    '0xe2e0c2b306fdbe3276726d1e55cd4821bcc9b6b4',
    '0xeeee3218673b475ccaee5ab16e9efd26c2ec8506',
    '0x6b4b8f5cfc4dce1434e9e0f01a7a129a07d13029',
    '0xc4397b4997f7f4e8fd0bf7785da63a10b99843a7',
    '0xe05781f206ee48606a2b73c08bea4dc4a48d6b42',
    '0x2dd2dec47ee395b4eb0049526362d58aebb7123b',
    '0x1ae502c08942501a6bf17aa2ba1ea5fc4f371a84',
    '0x6a1902bc0141cda8c7038439538785cfb8231080',
    '0x8d1b7dc54b9fe7dfb2cb8ae7feee9ac63feee3eb',
    '0x4d944019c7525abc4500683f22a82fba1c570757',
    '0xf62fb740d431b6f823096f4c3e808062762716e3',
    '0x84a0fca728b248ba9999208383a7c5b50a504bff',
    '0x763aad3f4c936d94d794451de89d8e3297091205',
    '0xaafeffaad916fe8703026f8c115dd04218b252dd',
    '0xda3325834c0a4e3ec1df159ac6767d794a2e1b91',
    '0xf77c3cccfc5f82c0c3a105f8dcd19c0ba60ce355',
    '0x755beec673f546446990a52ebf1df858d9c74231',
    '0x000b0aeea9f7aac942a10609b5324d8abe8acdac',
    '0x065d849772d2d18f450eb8d28cec3051ea9c8897',
    '0x2fc8fabce1b9e3c32dfe8f70284c79b9cde75f2b',
    '0xbabff1556079ef9ef592066bc95a186c729a2be9',
    '0x8e00f85d19e6a2681b5535b679c5957c42720a36',
    '0xb36f8628284638dfa103a8c2f426fdde289a4251',
    '0xd47bdd78c4eca4b5ac941a4b4cf62b34be730c42',
    '0x28da0f238c9eab656372a60e27409da2e2d8bb9c',
    '0x0dd74ffb7a7ecd80b56d220f6d6aa1c30651b35b',
    '0x3ba8363630543c0800480513f6988c253d724b23',
    '0x43bad2b427d11d913485b59fc7c4402a800c39a1',
    '0x04b3f338a588c9b62abd3cd9b3cc4e4025cad7c7',
    '0x43d58c0485e61c4b521f170466a4a984fd1bf82c',
    '0x79e1ab2abe2aa795ec69130fd127cebd9ebcb046',
    '0x0ba7a43d4a5c84d9a4afa7109ea1e022decb637a',
    '0x8f54d5dee9cc8a4792355674d52ec514b1f34573',
    '0x7a34d99e29dcdeffc48b972ff69b3e2343f0881b',
    '0x2c90202fdb0d54199e41b8cb9a7d4b6073d6f1f8',
    '0x47071cba941ef35924602c895ebfaa799cbe5c66',
    '0xba9b479bbc7447e563011a315f01a0eea3e4d13e',
    '0xa95e0d614e5d32640162da78f114d412586e5ee6',
    '0x351e7b7b6fef8a3243b994120533f992d14d2189',
    '0xc874b6428be58bf0ceb6dab5ac39b53e42a4643d',
    '0x937d93eefc90c889130ce275f7ac5b7ae7775722',
    '0x70232dcfb06e4037224506140d54f2bd4bdb0614',
    '0xe4cd87a8337afe18c46ddfc81d8c9ef085f4e5c8',
    '0xf37462a2bc92dcc584fe7158c8c0dd9509b8b976',
    '0x517bbc7671dc44b0c2e95b448d19590cbf1bc584',
    '0x2f27f0b18822b281d70e0e35d94a0cbaa386e536',
    '0x0539428e1c8da358b133b922ace2f0a7b47577cb',
    '0xa39c0e496470e7390223779d60ea714f1d73c423',
    '0x959f624ec5a1ff1e2726ea2d033a8c9fcda2a3c5',
    '0x0f2f26cba27603393e93a6098b8b033de08ca7f0',
    '0x999283dff770d2bab1e96a9a292dd1c50c93acd9',
    '0x8eb63febb50bad51c25c31c95ae785eee3607ae1',
    '0x713aa75a26665a0ee99cf30883cc59a744235d05',
    '0x47d16a12afbefe01f1c23ca49a0171643f3ae01a',
    '0x161596cbb8fc3d9b2b298e77db53f93ad27d684e',
    '0x3d461a940e1d18c0775cff40b6d205126381cbac',
    '0xca0f63379026f1a8ee615153b43a0ad07b991d7a',
    '0xd2cf224e458bc5ec4fbe81563bfb4d5252a20763',
    '0x93e9702adeb8ad040d3da639201edff5a6ab05db',
    '0xd2e5e2c1cb99af4cf334c7cfeb336b87ff88ec56',
    '0xd826517b5c4554c990003172aeb1cf76ab6eadb2',
    '0x9492e42063e578ad31e275e0cc74393063d0ec25',
    '0x01f573f39cf5b6334967e4b47c74da9fe5e76783',
    '0x069cb464dc3390dde11b014793c48fc9f7d06399',
    '0xb5f007fadaa5dae371412f0d7d4b310576db1728',
    '0x5a8ef2e398d94e0b4b86a048d6bfc221e2fc5ec5',
    '0xfda8643cb5a4edbfd45d96a1af196a919035c8ae',
    '0x21c53f0ac773145dbb25b556a5d4be9f05ce6b89',
    '0x8707ffb950d1a9a23dc3956680464e68c46854a2',
    '0x55a66e0fd88de991f804cb07f2e66c09fb9d7a2c',
    '0x0dd8968865d8f594170e440d4058147ea1f972c1',
    '0x1ba8836395ed42fd108a10e5f29eba3d13373836',
    '0x65e60208697c557dc9b0fb42f0c3e244345d4950',
    '0xe4a861118333045815b4d8b870806edb3c511d1e',
    '0xbdd0ca17cf366886d6ac7d7e3a387a98c01b3981',
    '0x1b8587d49cfee05364124674b448b53a1a9c7b15',
    '0x22cb1b25df2083247dc43a8de3050c47a7648a1a',
    '0x8bc4f771cc092481be7bfb3fa448ecbc52dbcbf6',
    '0x1e44f139f4c0f99b111728f70ffb3550edbbe33f',
    '0x0f7a8578c21a67de502b67ce2cbb2eb696950282',
    '0x17771a75208f0b3d8ae681e735fa6ba124be5b10',
    '0x358390703ae1ac555ed0629f0c94f358ac9c7dac',
    '0x010ce3e307df1192e811d50a2723e7369e578c87',
    '0x08696694f242f0760a8a3e5b6f415476dacc32f4',
    '0x00f79a6a46bec753a100cf1e1eb93fd34578a263',
    '0x4d631b8655ba8dfb23318be7a135805753618bd3',
    '0x5226827fdc7b662e1eaf0a3a1c200bc969e05cfb',
    '0x034767f3c519f361c5ecf46ebfc08981c629d381',
    '0x8cc8aa78fd2528d0c17917e64aacb8c49af7d0da',
    '0x8d5e4b51aa66b61d2f3dfdc2c30d0c23a51e7244',
    '0xeefb29492a7c78a58154682fb52393380f20670e',
    '0x47df896b8152d35af073ac6ed6b9acc214d263f3',
    '0x10306faa1b95aa77c192c7570932434d68244d46',
    '0x0330a1165e879a3c97c4a67329b4d3074d4882d8',
    '0x35453a5146b33acc88760285ca8257d6cae5edb8',
    '0x6ae5c6f3b408efbcf65a178b9a5876c425d86aa6',
    '0x84610724522e7e3e5276243883a3c75fd04b4cc7',
    '0xae9ed4f4e653094d49e8c6d150acfff05978347e',
    '0x66291edf5aa6a9a044fa162b96819817081414fa',
    '0xb68b575fe4352c953035156073b290f32f948e1a',
    '0x1243bb52874a78c24601ad7218230ec5601bd46e',
    '0x553ec10c3582fcc7d2302f7450c2a7422f58800c',
    '0x42c16d9e33807ae253b38643961878426317d8b6',
    '0x773c826fea427cfa0dc7c8ba5434eb9688c63f20',
    '0x2c393bc3550091d5e51941ad822ebe15146e6bea',
    '0xe743b53a4fdc26bdd915104e681c3ca521a843b6',
    '0x4174cf897c7801f56971a92ec34fdb35cedc78bc',
    '0x0dc94d57359b530b797ce9402fa27f39768ac55a',
    '0x052aa017270434c91ca09c082018bd3b8f26e613',
    '0xd0c9fd53110acea9cb2164cdb15672e52eff638d',
    '0x4d911e331512f7a90e3188e7779d752bb0af8d34',
    '0xdb94e6ed03b770eeedd313278da6f5b6d9af30be',
    '0x613e842ff69f6011b048604d4b8c4df8c8009585',
    '0x122d86399fa51faab42592859cd54d5f6a00ea7b',
    '0xff9212584a45a4a2d2ce2037909652a022d57efc',
    '0x35cf24efebbb842069b6a4b5eb2cefdc397e3db7',
    '0x4599cadb14d62955d84a64c001949bbc168bef75',
    '0xca8d4d3482c9698c503edf733987862db0efba4c',
    '0x0ec37f19445d407148c36b2694defd6a71fb96d2',
    '0xdbe51348bf36437a3edd27e29a8a349defe2731f',
    '0x1ff9baf10085d52532a524489ba4b5ef56f9f3a0',
    '0xdf5696a83241f68b25c38273ea8ca47ba201209c',
    '0x0cb6df90497aa0dfd77a7ad4f7d700b9fde70f59',
    '0x5c35ec189ef7a640a65e652af68831bec4af15e4',
    '0x052597710baf52dad971b253b7951601aed790ab',
    '0x9ed200b622f3fa3958c4a9dcdd6a7662c6f46259',
    '0xe10a4b89bc99586f4725b1f4f8a1f16d8c810446',
    '0x885f27c42c3e24daa1288a0360daadd756b201a9',
    '0x87002215a2bba7fe85a1f7ac99e73511b092cada',
    '0x607a1a997c1fdb596bf9903a8c2d2252e40dbed6',
    '0xd60e2ecad4125c6dccaca5d43fb3c04083add5b3',
    '0x6dbf65020e3af3293e46c49591670f4bade9bbcf',
    '0x4a0961ec099c104d21ac378e520096befb839990',
    '0x642c1847074d69a0d96de03f2f1bc435fea697c7',
    '0x18b36c43ff24dcdffe714fbddef608ec871afbb5',
    '0xdfad2d005af49740665a0b9a5a1db7d1e95a8579',
    '0xd4756a3626d08efde254ba3e9f1333912bfcb8e1',
    '0xcc8ee9a09aa4777f4511acb529b8e7f96ba974e0',
    '0xc48fb4868abb626fe0e8c7fc60d2d416936c6d7e',
    '0x9cc402e5b391aaefce74df5a9dd514ed2855dc8d',
    '0x6edd2a4d56d7834ff0cef239eddf50386ec85799',
    '0x98cb48f775c5bbf810c0f464ee1a092cb84369ac',
    '0xa21b0ee29d6fe5a8bba90b216c4aa2745bd0c2b0',
    '0xe03ac69adfeeb45251b3d80ee3b8f5807c05c7ed',
    '0x600b5548f02bd112adc9143c9bfa1b35a614ecff',
    '0x0dddfdae7cdd30deb26675c5553ea4c807a910e7',
    '0xa78660e4737f7653340b85d0748c9194120b1911',
    '0x26004ddac8af129a0a8fa6da516ee12e2b8569c8',
    '0x9ceeeeb558bb42ac9a4905f8cda9a14763ab9dc6',
    '0x54fe607485631d0773e2bfb9c8717feb7780120a',
    '0xfd81df5aca501497f85424052b91fc7ca4de04e4',
    '0x7532a9e3e9475337c8a907428e35932a20959fdf',
    '0xeb27ae58d1980d4c5726409c88aa14e9dd733fc0',
    '0x25fa4a1cd51618bdcf8c8072af5201b592a1e4a7',
    '0x38fd0b5e45cce5dd2e84776da4b0a88fdb8b2ee4',
    '0x5b9dce54e15bb0a8715c8f56e087c9d2ff11b311',
    '0x322c3abadc6687f9d3ac23ea82b762542f96635b',
    '0x60b19991ead62ae6d616c1843962760b68f7ecf5',
    '0xec6399722d6585f2b20b47adf1f646b45167911a',
    '0xd9e8fc2eddba82a9738b3ab4c4063d953427930c',
    '0x78a6f3a4620937588e76b6f8f0d6d5f6174511d4',
    '0x0c91ae5b9323c8aff73a45588f617a45054b2f8e',
    '0x0d3a0d06c044bb23278b12c5abeaea901e2fddfe',
    '0x2136d314b42d1355dd34a92ea2b8e858becfdb79',
    '0xbf1a4168eeb583a43caf9ec6a561da3af77fe6b7',
    '0x025a33b43c9452d3b139fcc50b71af3ab498495b',
    '0x883d5e513095e97239c64028bb6168e17c57275f',
    '0x4f914648d4ed6247129be15928e5175f6ff66697',
    '0x2604e0920ae3abe455968265a97f9cf2ab3e45fd',
    '0x84271d62e75fa6b17acbed9a8c5b3bb0f3cfb728',
    '0xa81325614729e3e881d4ef9dd8fb1905306106ae',
    '0x4a34a4714a62a90012c2b24d7ae36bb7e77047f4',
    '0xc977658056b8e839907699dbecbba699c1a8da86',
    '0xb6817cdf9ffdbbcfc791d28efdc317b52962cf21',
    '0xe90de1647632e92487d74066fe3fe0b18a9d8a07',
    '0xdb7df40815aaa920a00f7554a6ede8122fea5140',
    '0x78c38bb8da3c28a9a672e8983f0d5eee3bd28675',
    '0x795abc18db8364973f08ca71e52ab6c049e12427',
  ]

  // loop & log checksum addresses
  for (const address of addresses) {
    console.log(ethers.utils.getAddress(address))
  }
}

convertChecksumAddresses().catch(console.error)
