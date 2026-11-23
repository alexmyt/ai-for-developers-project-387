# Changelog

## [0.6.1](https://github.com/alexmyt/ai-for-developers-project-387/compare/v0.6.0...v0.6.1) (2026-11-23)


### Bug Fixes

* **workflow:** вернуть opencode.json к V1-совместимому формату ([c307e84](https://github.com/alexmyt/ai-for-developers-project-387/commit/c307e84cb82d3cb99b908b76a3c3a5138e4f2349)), closes [#14](https://github.com/alexmyt/ai-for-developers-project-387/issues/14)
* **workflow:** запретить агенту /oc править файлы воркфлоу ([5714919](https://github.com/alexmyt/ai-for-developers-project-387/commit/5714919782ecc9b311af6bd588a01e109ea0e5d7))
* **workflow:** запретить агенту /oc править файлы воркфлоу ([732c5df](https://github.com/alexmyt/ai-for-developers-project-387/commit/732c5df172663eafc5bc8053ab1606d589327f2c)), closes [#14](https://github.com/alexmyt/ai-for-developers-project-387/issues/14)
* **workflow:** перевести правила каталогов в V1-форму permission ([75c814a](https://github.com/alexmyt/ai-for-developers-project-387/commit/75c814a9bfa06dcf8cfa97db2da7198ae3d6b9e4)), closes [#14](https://github.com/alexmyt/ai-for-developers-project-387/issues/14)
* **workflow:** повторять запросы gh api бюджета /oc при сбоях 5xx ([3765910](https://github.com/alexmyt/ai-for-developers-project-387/commit/37659104022817b88a7c80068624149b59bde8fa))
* **workflow:** повторять запросы gh api бюджета /oc при сбоях 5xx ([b6a7a32](https://github.com/alexmyt/ai-for-developers-project-387/commit/b6a7a32bda37f36341fce6f4a6fca6cd9e0dacd7)), closes [#14](https://github.com/alexmyt/ai-for-developers-project-387/issues/14)
* **workflow:** сохранять отчёт аудита и создавать issue ([7fcad7b](https://github.com/alexmyt/ai-for-developers-project-387/commit/7fcad7b736ec219fae7ea2525ff3c72864d0df9b))
* **workflow:** считать бюджет /oc по вызовам модели ([2f77528](https://github.com/alexmyt/ai-for-developers-project-387/commit/2f77528a796fd2f8cabecc0c4f04a3c16ff05296))
* **workflow:** считать бюджет /oc по вызовам модели ([8ae491c](https://github.com/alexmyt/ai-for-developers-project-387/commit/8ae491cd9158f7d7f74258bbe702f48ac27e60c9)), closes [#14](https://github.com/alexmyt/ai-for-developers-project-387/issues/14)
* **workflow:** убрать catch-all из edit-правил, ассертировать эффективные права ([5a8e06c](https://github.com/alexmyt/ai-for-developers-project-387/commit/5a8e06c600b473aebb08729c3e0066acfece73e0))

## [0.6.0](https://github.com/alexmyt/ai-for-developers-project-387/compare/v0.5.0...v0.6.0) (2026-11-22)


### Features

* **api:** исполнять JSON-схемы request-телов из openapi.json ([a03b101](https://github.com/alexmyt/ai-for-developers-project-387/commit/a03b101ff197bc0c2fc8e12685920ffc3240d34b)), closes [#8](https://github.com/alexmyt/ai-for-developers-project-387/issues/8)
* **api:** исполнять схемы запросов из openapi.json, убрав ручные копии правил ([591290b](https://github.com/alexmyt/ai-for-developers-project-387/commit/591290b02d86c579798e5183be2b392d972b0600))
* **interval:** вынести intervalsIntersect в пакет @repo/interval ([13ccdb9](https://github.com/alexmyt/ai-for-developers-project-387/commit/13ccdb9653ed671e98458faa832b41c0c955ce2f)), closes [#4](https://github.com/alexmyt/ai-for-developers-project-387/issues/4)


### Bug Fixes

* **api:** восстановить прежний приоритет сообщений проверок §8 ([be60a88](https://github.com/alexmyt/ai-for-developers-project-387/commit/be60a88a7d26e51f6ea84335ac8edadf036ed6c9)), closes [#8](https://github.com/alexmyt/ai-for-developers-project-387/issues/8)
* **api:** перенести ajv в зависимости рантайма ([5deaf97](https://github.com/alexmyt/ai-for-developers-project-387/commit/5deaf974b380ea65677079972a578d87901c5d43)), closes [#8](https://github.com/alexmyt/ai-for-developers-project-387/issues/8)
* **workflow:** change log level from INFO to info in OpenCode PR review step ([3802480](https://github.com/alexmyt/ai-for-developers-project-387/commit/38024805829c301135512aefa46243ce25d6a32b))
* **workflow:** extend review model timeout to 480 seconds ([f8f77a2](https://github.com/alexmyt/ai-for-developers-project-387/commit/f8f77a28a61caf4a296fbc3896937597356a6413))
* **workflow:** publish full review as pr review body ([b1469aa](https://github.com/alexmyt/ai-for-developers-project-387/commit/b1469aa06c0073d546026776e81215a04570010e))
* **workflow:** simplify opencode PR review to summary comment ([7a36758](https://github.com/alexmyt/ai-for-developers-project-387/commit/7a36758a59b64cc0f6aea3237c41dbd0d5110f8a))
* **workflow:** unblock opencode on external directory permission ([4bd3bb5](https://github.com/alexmyt/ai-for-developers-project-387/commit/4bd3bb51e5ff8dce380311040e671ca5ffa65d9a))
* **workflow:** use lowercase log level for opencode review ([a88137c](https://github.com/alexmyt/ai-for-developers-project-387/commit/a88137ccbe881a1d37b334b31207cca25ae2e83e))
* **workflow:** вернуть with: model и брать head SHA для всех причин ([8177342](https://github.com/alexmyt/ai-for-developers-project-387/commit/817734224094b9a067299a9106185c117260ca44))
* **workflow:** публиковать отчёт при таймауте и уточнить SHA в отчёте ([e8cf5aa](https://github.com/alexmyt/ai-for-developers-project-387/commit/e8cf5aac49acc53f9f188e57d0a1b1efca7bcc51))
* **workflow:** устранить находки авторевью бюджета и артефакта ([7a951c4](https://github.com/alexmyt/ai-for-developers-project-387/commit/7a951c4aff561e379ede3c71ff91a17cfcc8b65e))
* строить @repo/interval до typecheck и тестов ([fffba51](https://github.com/alexmyt/ai-for-developers-project-387/commit/fffba51ccb378a366ebe039079c2fef6a72e2514)), closes [#6](https://github.com/alexmyt/ai-for-developers-project-387/issues/6)

## [0.5.0](https://github.com/alexmyt/ai-for-developers-project-387/compare/v0.4.0...v0.5.0) (2026-11-19)


### Features

* add issue triage workflow to automate issue handling ([b7d076a](https://github.com/alexmyt/ai-for-developers-project-387/commit/b7d076a6e15d27302c9c65575a86194560eb509b))


### Bug Fixes

* **ci:** prevent bot accounts from triggering opencode actions ([fbd5847](https://github.com/alexmyt/ai-for-developers-project-387/commit/fbd5847f51401fed83c817fa4205911f249669d8))
* **ci:** repair mise lock digest for opencode sidecar ([67f6005](https://github.com/alexmyt/ai-for-developers-project-387/commit/67f60058ab5be2cc0d8e11b617e0ef27c546c768))
* **ci:** use the deepseek model id available to the gateway key ([95b6a94](https://github.com/alexmyt/ai-for-developers-project-387/commit/95b6a9420b2fa5f8429dfef72eed72d34fa833f3))
* **workflow:** skip opencode triage for bot authors, pass jactionlint ([96c4bed](https://github.com/alexmyt/ai-for-developers-project-387/commit/96c4bed6caf7100bc2bc3fc1db0348a20d71438c))

## [0.4.0](https://github.com/alexmyt/ai-for-developers-project-386/compare/v0.3.0...v0.4.0) (2026-11-14)


### Features

* **web:** format day heading in russian ([f1acf8f](https://github.com/alexmyt/ai-for-developers-project-386/commit/f1acf8f3f75a1efabb76fc55cc26b5d59dfcb91c))
* **web:** show msk timezone on time labels ([f91b2cc](https://github.com/alexmyt/ai-for-developers-project-386/commit/f91b2ccab874801fdf0e339d3737c62f4b55e815))


### Bug Fixes

* **web:** mark overlapping slots taken after booking ([ff34fb8](https://github.com/alexmyt/ai-for-developers-project-386/commit/ff34fb8229e766157a49fcd0bee1449594adc8a4))

## [0.3.0](https://github.com/alexmyt/ai-for-developers-project-386/compare/v0.2.0...v0.3.0) (2026-11-14)


### Features

* **deploy:** add render blueprint ([03ebe69](https://github.com/alexmyt/ai-for-developers-project-386/commit/03ebe69288a6f396f8afcb10d9f962c7e4cc6fd4))


### Bug Fixes

* **deploy:** authenticate render mcp with an api key ([b37c09d](https://github.com/alexmyt/ai-for-developers-project-386/commit/b37c09dd2a3558fc2909b8f915e4d23588993d1a))
* **deploy:** bridge render mcp through mcp-remote ([6a36556](https://github.com/alexmyt/ai-for-developers-project-386/commit/6a36556a158664585a88bbbd4ca1e12eb0d4320a))
* **docker:** honor PORT in healthcheck and container e2e ([a4e38e2](https://github.com/alexmyt/ai-for-developers-project-386/commit/a4e38e2f894072de14e7b60150568b0ded925dd8))

## [0.2.0](https://github.com/alexmyt/ai-for-developers-project-386/compare/v0.1.0...v0.2.0) (2026-11-12)


### Features

* **api:** create booking inside per-date mutex ([9b4154a](https://github.com/alexmyt/ai-for-developers-project-386/commit/9b4154a5364261dfe8616d31d223cbb57d16fa16))
* **api:** create meeting type with field validation and id conflict ([c28d843](https://github.com/alexmyt/ai-for-developers-project-386/commit/c28d8433aa17f65f3372c0825ad7a5bf0c047d6b))
* **api:** serve 14-day availability grid from in-memory state ([aed923f](https://github.com/alexmyt/ai-for-developers-project-386/commit/aed923f7e5f171cd9e498b7e7ceb3335f51ccf4e))
* **api:** serve built web static with spa fallback ([80728ea](https://github.com/alexmyt/ai-for-developers-project-386/commit/80728ea8b8bb7e76e6a06a2b821c80ad056019a8))
* **api:** serve meeting types from in-memory store ([a1fd6e2](https://github.com/alexmyt/ai-for-developers-project-386/commit/a1fd6e2bb20bba71ece519d88f9bc261f575c014))
* **api:** serve upcoming bookings list to owner ([4865049](https://github.com/alexmyt/ai-for-developers-project-386/commit/48650490a69e9508d2fd21ef99b71f4f14d39743))
* **api:** validate booking window, grid and interval overlap ([250c569](https://github.com/alexmyt/ai-for-developers-project-386/commit/250c569818d5964c863dfd065e7dfd8f1cf62034))
* **contract:** add availability operation with typed errors ([7c1b39a](https://github.com/alexmyt/ai-for-developers-project-386/commit/7c1b39ae495df83cae63fb58a440acdd50c22ae2))
* **contract:** add create booking operation with typed errors ([ce47d05](https://github.com/alexmyt/ai-for-developers-project-386/commit/ce47d0592121fc4880cf8c8e28fedd4d1b8bd0fc))
* **contract:** add create meeting type operation ([768d587](https://github.com/alexmyt/ai-for-developers-project-386/commit/768d5873e106248d3f3541dfb09d62831009fa9b))
* **contract:** add list bookings operation for owner ([5f7854a](https://github.com/alexmyt/ai-for-developers-project-386/commit/5f7854a5c5487f269945f39f7566252c28cf7ad1))
* **contract:** describe meeting type and generate sdk client ([e9b757c](https://github.com/alexmyt/ai-for-developers-project-386/commit/e9b757cb921e53c9554b373433a2a7ee65d86bd4))
* **tooling:** run all checks with one command ([2208f42](https://github.com/alexmyt/ai-for-developers-project-386/commit/2208f42e50a351a04ab877217fc4acd2fa8e7f2c)), closes [#27](https://github.com/alexmyt/ai-for-developers-project-386/issues/27)
* **web:** add continue step between slot choice and guest form ([070b84c](https://github.com/alexmyt/ai-for-developers-project-386/commit/070b84c478cb0826c7132f480fe18ee85ff74276))
* **web:** add guest entry page and booking stub ([f3165c9](https://github.com/alexmyt/ai-for-developers-project-386/commit/f3165c9ab6b9a58e096ed60b84d00ed2afbd9905))
* **web:** add owner admin screen for creating meeting types ([59b490a](https://github.com/alexmyt/ai-for-developers-project-386/commit/59b490ab1aa891c5a3b1b8e46079cd6f5510557c))
* **web:** let guest book a free slot with name and email ([8a23200](https://github.com/alexmyt/ai-for-developers-project-386/commit/8a232008d871b22b52b74491d5bc8ad4d4cf18cc))
* **web:** return guest to slot choice on slot_taken conflict ([0327b81](https://github.com/alexmyt/ai-for-developers-project-386/commit/0327b810a22f7be50dcb5c94a00e6946b933d9b8))
* **web:** show 14-day calendar with slot statuses on book page ([9d4eb81](https://github.com/alexmyt/ai-for-developers-project-386/commit/9d4eb8191937a5a18b3340a323cda7e317978d29))
* **web:** show meeting types fetched via generated sdk ([85e9817](https://github.com/alexmyt/ai-for-developers-project-386/commit/85e98171e0911277da32ad694a01af1e96d82e0a))
* **web:** show upcoming bookings on owner page ([e9d4766](https://github.com/alexmyt/ai-for-developers-project-386/commit/e9d476620c54aedfedf077bd2f26bc578527b7d8))
* **web:** главная страница ([a5df095](https://github.com/alexmyt/ai-for-developers-project-386/commit/a5df0957658f3c51935b94103640a918830452a3))


### Bug Fixes

* **opencode:** correct model name casing ([22da30e](https://github.com/alexmyt/ai-for-developers-project-386/commit/22da30e91b7f6831aeba736d9732c97138ec8499))
