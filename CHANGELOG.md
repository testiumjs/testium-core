### v3.1.1 (2021-10-26)
<a id="v3.1.1"></a>
#### 🏡 Internal

* [#62](https://github.com/testiumjs/testium-core/pull/62) stop specifying disk cache as /dev/null ([@dbushong](https://github.com/dbushong))


### v3.1.0 (2021-10-20)
<a id="v3.1.0"></a>
#### 🏡 Internal

* [#61](https://github.com/testiumjs/testium-core/pull/61) support "processes" to handle extra procs ([@dbushong](https://github.com/dbushong))


### v3.0.7 (2021-10-19)
<a id="v3.0.7"></a>
#### 🏡 Internal

* [#60](https://github.com/testiumjs/testium-core/pull/60) misc. cleanup ([@dbushong](https://github.com/dbushong))
* [`f876dc5`](https://github.com/testiumjs/testium-core/commit/f876dc51417779e1df7690cd491c03869f2ccab4) chore: fix release workflow


### v3.0.6 (2021-05-10)

#### 🔼 Dependencies

* [#56](https://github.com/testiumjs/testium-core/pull/56) chore(deps): bump hosted-git-info from 2.7.1 to 2.8.9 ([@dependabot[bot]](https://github.com/apps/dependabot)) 
* [#54](https://github.com/testiumjs/testium-core/pull/54) chore(deps): bump y18n from 3.2.1 to 3.2.2 ([@dependabot[bot]](https://github.com/apps/dependabot)) 
* [#55](https://github.com/testiumjs/testium-core/pull/55) chore(deps): bump underscore from 1.9.2 to 1.13.1 ([@dependabot[bot]](https://github.com/apps/dependabot)) 


### v3.0.5 (2021-03-26)

#### 🏡 Internal

* [#53](https://github.com/testiumjs/testium-core/pull/53) chore: change to main; update dependencies & drop Node 8 support ([@aaarichter](https://github.com/aaarichter)) 


### 3.0.4

* chore(deps): bump dot-prop from 4.2.0 to 4.2.1 - **[@dependabot[bot]](https://github.com/apps/dependabot)** [#52](https://github.com/testiumjs/testium-core/pull/52)
  - [`1958aec`](https://github.com/testiumjs/testium-core/commit/1958aec2be753c6d707b792951f3b312c006b96e) **chore:** bump dot-prop from 4.2.0 to 4.2.1


### 3.0.3

* chore(deps): bump ini from 1.3.5 to 1.3.7 - **[@dependabot[bot]](https://github.com/apps/dependabot)** [#51](https://github.com/testiumjs/testium-core/pull/51)
  - [`0527392`](https://github.com/testiumjs/testium-core/commit/0527392e35a9654c8a5f923aa002afb132446436) **chore:** bump ini from 1.3.5 to 1.3.7 - see: [v1](- [Commits](https://github.com/isaacs/ini/compare/v1)
* chore(deps): bump bl from 4.0.2 to 4.0.3 - **[@dependabot[bot]](https://github.com/apps/dependabot)** [#50](https://github.com/testiumjs/testium-core/pull/50)
  - [`0ca53f1`](https://github.com/testiumjs/testium-core/commit/0ca53f176cc64f16a133d385fad0db8fc87aed60) **chore:** bump bl from 4.0.2 to 4.0.3 - see: [v4](- [Commits](https://github.com/rvagg/bl/compare/v4)


### 3.0.2

* chore(deps): bump lodash from 4.17.15 to 4.17.19 - **[@dependabot[bot]](https://github.com/apps/dependabot)** [#49](https://github.com/testiumjs/testium-core/pull/49)
  - [`4e07f44`](https://github.com/testiumjs/testium-core/commit/4e07f441998f46399813205a4a8223507b22c1b2) **chore:** bump lodash from 4.17.15 to 4.17.19 - see: [4](- [Commits](https://github.com/lodash/lodash/compare/4)


### 3.0.1

* chore: update packages - **[@aaarichter](https://github.com/aaarichter)** [#48](https://github.com/testiumjs/testium-core/pull/48)
  - [`c80d875`](https://github.com/testiumjs/testium-core/commit/c80d87561f3ab78f682b6fff834a3b4355ff081a) **chore:** update packages
  - [`6b65ed6`](https://github.com/testiumjs/testium-core/commit/6b65ed64ae9f11feef765f8ae92b27a9daa654b1) **test:** disable non-standard chromedriver tests
  - [`5e694ff`](https://github.com/testiumjs/testium-core/commit/5e694ff606e3e987feb29ccfedc22215e5e0383a) **test:** seperate chromedriver tests
  - [`f97687a`](https://github.com/testiumjs/testium-core/commit/f97687a902d8c1f41ed4ff7acf1ce76c6c717584) **test:** increase timeout


### 3.0.0

#### Breaking Changes

drop ES5-compatible syntax, requires Node v8.3.0+

*See: [`fda604d`](https://github.com/testiumjs/testium-core/commit/fda604de6bba44d5bbdf31e2bb047d80e176a542)*

proxy.tunnel.host no longer supported

*See: [`dff3578`](https://github.com/testiumjs/testium-core/commit/dff35787947da9d905d41262bf10e1816901ca93)*

#### Commits

* update deps, refactor, update JS, drop features - **[@dbushong](https://github.com/dbushong)** [#47](https://github.com/testiumjs/testium-core/pull/47)
  - [`e7dc4c3`](https://github.com/testiumjs/testium-core/commit/e7dc4c3c687c49a31cfd6d8f04079dfe011aa599) **chore:** update deps
  - [`031b4ef`](https://github.com/testiumjs/testium-core/commit/031b4efa13821d65a5fa357b44fc132dbc564e9d) **chore:** npm audit fix
  - [`ba1153c`](https://github.com/testiumjs/testium-core/commit/ba1153c5d8b17ba2236d13d859aaa4ec304f5658) **chore:** npm audit fix --force
  - [`fda604d`](https://github.com/testiumjs/testium-core/commit/fda604de6bba44d5bbdf31e2bb047d80e176a542) **refactor:** pass lint
  - [`2cbfe66`](https://github.com/testiumjs/testium-core/commit/2cbfe66ad5cabc675720407890ade69592f59b8b) **refactor:** URL fixes and dump sync tests
  - [`2a67316`](https://github.com/testiumjs/testium-core/commit/2a67316b930284fe84b9516e3afb98090a9d911d) **fix:** revert URL upgrades for now
  - [`16702d7`](https://github.com/testiumjs/testium-core/commit/16702d70007c57e2c70b5e7bd3444a04179272ed) **test:** fix tests for phantom
  - [`dff3578`](https://github.com/testiumjs/testium-core/commit/dff35787947da9d905d41262bf10e1816901ca93) **refactor:** remove proxy.tunnel.host support
  - [`b7c936e`](https://github.com/testiumjs/testium-core/commit/b7c936e0c9ef273a9da4b4166291bf741dddc3e8) **test:** re-enable chrome tests
  - [`4220c00`](https://github.com/testiumjs/testium-core/commit/4220c00dc1a2104ffa8067b3992368e0bb507db1) **chore:** update selenium-download version
  - [`70c5eee`](https://github.com/testiumjs/testium-core/commit/70c5eee5bd2ea1a102747385b928770d807b0c29) **test:** disable troublesome union mount test
  - [`12d7e9d`](https://github.com/testiumjs/testium-core/commit/12d7e9d20e51786d3396e80d0b29e2f374271fca) **refactor:** add vendored, promisified subprocess
  - [`b14a9d8`](https://github.com/testiumjs/testium-core/commit/b14a9d8536f2f5607abf13fc825a28e70cc6644c) **test:** fix local test running
  - [`3fc283a`](https://github.com/testiumjs/testium-core/commit/3fc283aca0633788e3bffd9575e7b533a0987f0d) **chore:** (re-)add copyright headers
  - [`0b000e5`](https://github.com/testiumjs/testium-core/commit/0b000e5d68a9995b71848d21dce8d5dcb74aec39) **chore:** upgrade chromedriver devDep
  - [`7e031e0`](https://github.com/testiumjs/testium-core/commit/7e031e0cbc45a911db90966dcc8f7aabe198ca85) **refactor:** use modern promisified setTimeout


### 2.0.0

#### Breaking Changes

This change will force existent clients
to update their code to either explicitly use the sync
driver or use the async API

*See: [`8749fde`](https://github.com/testiumjs/testium-core/commit/8749fdea404bc2d9e29d44ec6c9d385f5713b387)*

#### Commits

* change default driver to wd - **[@aotarola](https://github.com/aotarola)** [#45](https://github.com/testiumjs/testium-core/pull/45)
  - [`8749fde`](https://github.com/testiumjs/testium-core/commit/8749fdea404bc2d9e29d44ec6c9d385f5713b387) **feat:** change default driver to wd
  - [`2eb055e`](https://github.com/testiumjs/testium-core/commit/2eb055ee641b2be25d7f873c4c60db509b3d47ca) **test:** use async instead of Bluebird promises
  - [`f900cb7`](https://github.com/testiumjs/testium-core/commit/f900cb77d877db00ded9d07f4705efcd73b41420) **test:** remove extra whitespace
  - [`f1c360f`](https://github.com/testiumjs/testium-core/commit/f1c360ff4a0dd1837f009e5c35327abd48d28e4b) **chore:** npm audit fix


### 1.12.1

* headless=false - **[@dbushong](https://github.com/dbushong)** [#43](https://github.com/testiumjs/testium-core/pull/43)
  - [`38d0524`](https://github.com/testiumjs/testium-core/commit/38d05249c7e3067f7707f6794bead88b9bdc3d52) **fix:** support testium_chrome__headless=false
  - [`ccfd174`](https://github.com/testiumjs/testium-core/commit/ccfd17457fe145e696a79a49601f8057b922528f) **chore:** switch to npm6
  - [`f5184cd`](https://github.com/testiumjs/testium-core/commit/f5184cd3ace5c17ca5f0fc1d8cd5975c89b3ae2c) **chore:** travis: try removing oracle-java setting
  - [`1db5303`](https://github.com/testiumjs/testium-core/commit/1db53036a9799990f37c51f97d8a0a3617877623) **chore:** upgrade node versions
* [`a8b40d5`](https://github.com/testiumjs/testium-core/commit/a8b40d5bad9a8494f1cef01b8462e220a2d776d8) **chore:** fix .travis.yml build version


### 1.12.0

* feat: add config option to merge chromeOptions - **[@amkirwan](https://github.com/amkirwan)** [#42](https://github.com/testiumjs/testium-core/pull/42)
  - [`264b081`](https://github.com/testiumjs/testium-core/commit/264b0813278657aee625f921640bd45c352590bd) **feat:** add config option to merge chromeOptions
  - [`68e552e`](https://github.com/testiumjs/testium-core/commit/68e552e20cccba92b9c7da1490f44321eb74247c) **fix:** address pr comments
  - [`238cdcc`](https://github.com/testiumjs/testium-core/commit/238cdcc2201ab8f8be9167b714e34e85e63507e6) **fix:** pr comments


### 1.11.0

* chore: add --disable-dev-shm-usage for chromeOptions - **[@amkirwan](https://github.com/amkirwan)** [#41](https://github.com/testiumjs/testium-core/pull/41)
  - [`17dcc8a`](https://github.com/testiumjs/testium-core/commit/17dcc8aa3d380f8432eea0d4c3f4ff28d55382cc) **chore:** add --disable-dev-shm-usage for chromeOptions
  - [`9013c32`](https://github.com/testiumjs/testium-core/commit/9013c3258fc1e06631558c57ed233e756c2b67e1) **chore:** update travis.yml with node10
  - [`9cc6144`](https://github.com/testiumjs/testium-core/commit/9cc6144c7fcc039de4dad8c541ab2d4279b94544) **feat:** check for docker env when setting --disable-dev-shm-usage
  - [`56dc3fd`](https://github.com/testiumjs/testium-core/commit/56dc3fd9de5b153f27b453ef7eb18900fb52eb1a) **chore:** use ternary for err check
  - [`31b4e18`](https://github.com/testiumjs/testium-core/commit/31b4e180a8f558ade58dfb0989ffa7381680f352) **fix:** pr comments


### 1.10.0

* Revert "Merge pull request #39 from anil-groupon/pass-debug-port" - **[@jkrems](https://github.com/jkrems)** [#40](https://github.com/testiumjs/testium-core/pull/40)
  - [`a7b2116`](https://github.com/testiumjs/testium-core/commit/a7b21161d6aacf2ecc21f45bf5d0806f3e5bed38) **fix:** Revert "Merge pull request #39 from anil-groupon/pass-debug-port"
  - [`ee2e251`](https://github.com/testiumjs/testium-core/commit/ee2e251f604c1151861c015748c950c48aa92994) **feat:** reimplement getChromeDevtoolsPort
  - [`30e3e9a`](https://github.com/testiumjs/testium-core/commit/30e3e9ae458ce3f66f31100dbaf01345ef6b70fb) **feat:** Add debug log for devtools port


### 1.9.0

* Pass remote debugging port for chrome - **[@anil-groupon](https://github.com/anil-groupon)** [#39](https://github.com/testiumjs/testium-core/pull/39)
  - [`209ebae`](https://github.com/testiumjs/testium-core/commit/209ebae6dd8751e233a646655f2ea23c9a8eaa32) **feat:** Pass remote debugging port for chrome
  - [`2274697`](https://github.com/testiumjs/testium-core/commit/227469762a78c5a749a8f060f63a5d21d53cab4c) **chore:** handle review comments
  - [`c942a21`](https://github.com/testiumjs/testium-core/commit/c942a21c0260788553c2fbdca6ca8fcdf32914d8) **chore:** PR review comment
  - [`115d0c7`](https://github.com/testiumjs/testium-core/commit/115d0c7d6f0665d019c1616ec608bf7c2ac9a9ef) **chore:** remove check for the config flag


### 1.8.1

* chrome --no-sandbox when run as root - **[@dbushong](https://github.com/dbushong)** [#38](https://github.com/testiumjs/testium-core/pull/38)
  - [`a1af370`](https://github.com/testiumjs/testium-core/commit/a1af370bbee31d8639e100d4b7278cc05a6c41d8) **fix:** chrome --no-sandbox when run as root


### 1.8.0

* use chromedriver directly without jar - **[@dbushong](https://github.com/dbushong)** [#37](https://github.com/testiumjs/testium-core/pull/37)
  - [`f5c9220`](https://github.com/testiumjs/testium-core/commit/f5c9220cf823656dbf6de9cf0b1e745e3787e5c3) **feat:** use chromedriver directly without jar


### 1.7.3

* selenium invocation -debug argument - **[@dbushong](https://github.com/dbushong)** [#36](https://github.com/testiumjs/testium-core/pull/36)
  - [`346055d`](https://github.com/testiumjs/testium-core/commit/346055d57307a00712724ce34bae51ba62b27d2d) **fix:** selenium invocation -debug argument


### 1.7.2

* fix: properly invoke selenium.jar with -debug flag - **[@dbushong](https://github.com/dbushong)** [#35](https://github.com/testiumjs/testium-core/pull/35)
  - [`76f1358`](https://github.com/testiumjs/testium-core/commit/76f13586d852783a0f5e723cabd8a87f041d188e) **fix:** properly invoke selenium.jar with -debug flag


### 1.7.1

* fix: fail quickly on aborted client request - **[@dbushong](https://github.com/dbushong)** [#33](https://github.com/testiumjs/testium-core/pull/33)
  - [`ce08240`](https://github.com/testiumjs/testium-core/commit/ce082401cd53ae3099ffff478adf24088dca3dd3) **fix:** fail quickly on aborted client request
  - [`1c370c4`](https://github.com/testiumjs/testium-core/commit/1c370c4ca6a86cb794f0e598e5c08a90e72b50fa) **chore:** test on node 4 & 6, fix java
  - [`bbfd324`](https://github.com/testiumjs/testium-core/commit/bbfd324a2ddd4450ee3f6e42e3a1e2775bc3e6ef) **fix:** make selenium standalone args 3.x compat


### 1.7.0

* feat: tunnel: checks ~/.ssh for keys if no agent - **[@dbushong](https://github.com/dbushong)** [#30](https://github.com/testiumjs/testium-core/pull/30)
  - [`f345b0d`](https://github.com/testiumjs/testium-core/commit/f345b0d393fe51c98d1c5115ea231f9ef3833a79) **feat:** tunnel: checks ~/.ssh for keys if no agent
  - [`7957cd8`](https://github.com/testiumjs/testium-core/commit/7957cd846d8bf01b96da207b8a697dd5c296aabf) **test:** use & verify dynamic ports for proxy testing


### 1.6.0

* Add support for `proxy.tunnel` - **[@dbushong](https://github.com/dbushong)** [#28](https://github.com/testiumjs/testium-core/pull/28)
  - [`e903115`](https://github.com/testiumjs/testium-core/commit/e903115df9494b13ce2ea728a6d607be205099e6) **chore:** update nlm stuffs
  - [`ac85f32`](https://github.com/testiumjs/testium-core/commit/ac85f3286671ebbd390b63beabb34d16c250756f) **feat:** add support for proxy.tunnel.host


### 1.5.0

* feat: use proxy.host for remote selenium grid - **[@dbushong](https://github.com/dbushong)** [#27](https://github.com/testiumjs/testium-core/pull/27)
  - [`9bd6642`](https://github.com/testiumjs/testium-core/commit/9bd66424bea8798eef197c083aa10039193e3ae7) **feat:** use proxy.host for remote selenium grid


### 1.4.8

* fix: switch cleanly between driver types per-file - **[@dbushong](https://github.com/dbushong)** [#23](https://github.com/testiumjs/testium-core/pull/23)
  - [`5087c11`](https://github.com/testiumjs/testium-core/commit/5087c1175f1462bb00edc7443b3e86e2c1449952) **fix:** switch cleanly between driver types per-file


### 1.4.7

* Correct config setting for `selenium.timeout` - **[@dbushong](https://github.com/dbushong)** [#22](https://github.com/testiumjs/testium-core/pull/22)
  - [`c01fb8f`](https://github.com/testiumjs/testium-core/commit/c01fb8f95dd4eaed3876d0dcc47c628932667886) **fix:** correct config setting for selenium.timeout


### 1.4.6

* Initial URL is never the new page URL - **[@jkrems](https://github.com/jkrems)** [#20](https://github.com/testiumjs/testium-core/pull/20)
  - [`aa1587e`](https://github.com/testiumjs/testium-core/commit/aa1587e88c4dbde80049818686a15468ec658901) **fix:** Initial URL is never the new page URL
* Use Groupon project template & nlm - **[@jkrems](https://github.com/jkrems)** [#21](https://github.com/testiumjs/testium-core/pull/21)
  - [`d79ed1b`](https://github.com/testiumjs/testium-core/commit/d79ed1b7211e64063181a3db3e17d3fc3f603c5b) **chore:** Use Groupon project template & nlm
  - [`d69df68`](https://github.com/testiumjs/testium-core/commit/d69df685d6ff0cdba398de0b5d3cbb29b030f56f) **chore:** Use latest lodash & bluebird


1.4.5
-----
* fix: Use existing app when started with `testium_launch=false`
  https://github.com/testiumjs/testium-core/pull/18
* Port contributor info, add code of conduct - @jkrems
  https://github.com/testiumjs/testium-core/pull/17

1.4.4
-----
* Send headers to a page with hash segments - @jkrems
  https://github.com/testiumjs/testium-core/pull/16

1.4.3
-----
* Fix handling of urls hash segment - @jkrems
  https://github.com/testiumjs/testium-core/pull/15

1.4.2
-----
* Fix regression when using launch=false - @jkrems
  https://github.com/testiumjs/testium-core/pull/13

1.4.1
-----
* Restore page size when getting testium - @jkrems
  https://github.com/testiumjs/testium-core/pull/14

1.4.0
-----
* Prefer browser.quit for wd's sake
  https://github.com/testiumjs/testium-core/pull/11

1.3.1
-----
* Default proxy port to 4445 - @jkrems
  https://github.com/testiumjs/testium-core/pull/12

1.3.0
-----
* Add singleton logic from testium - @jkrems
  https://github.com/testiumjs/testium-core/pull/10

1.2.0
-----
* Support the testium_app=null variant
* Fix hanging build on node 0.10
* Add support for launching selenium
  https://github.com/testiumjs/testium-core/pull/8

1.1.3
-----
* Fix handling of external urls
  https://github.com/testiumjs/testium-core/pull/7

1.1.2
-----
* Fix new page url with options - @jkrems
  https://github.com/testiumjs/testium-core/pull/6

1.1.1
-----
* Fix missing _testium_ cookies - @jkrems
  https://github.com/testiumjs/testium-core/pull/5

1.1.0
-----
* Use the newly released testium-cookie - @jkrems
  https://github.com/testiumjs/testium-core/pull/4
* Fix .close() after switch to subprocess - @jkrems
  https://github.com/testiumjs/testium-core/pull/3

1.0.0
-----
* Initial release
