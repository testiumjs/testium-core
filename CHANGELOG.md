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
