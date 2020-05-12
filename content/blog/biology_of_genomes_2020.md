+++
title = "The biology of Genomes at CSHL"
date = 2020-05-12
draft = false
order = 0
weight = 0
aliases = []
template = "page.html"
[taxonomies]
tags = ["Bioinformatics","Biology", "Conference"]
categories = ["Biology"]
[extra]

+++

The Biology of genomes at CSHL 

ブログの更新が途絶えていたが、これはほぼ完全に私が怠惰なせいであり、社会的事情とは一切関係ない。気がつけば五月も中旬であることから察するに、私がかなり怠惰であったことが分かる。


さて、怠惰な間、アメリカは仮想上のCold Spring harbor 研究所ではThe biology of Genomesという国際会議が開催されていた。


仮想上のというのは、Covid19、いわゆる新型コロナウィルスの影響により、国際会議をそのままの形で行うことが困難になったため、インターネット上で開催する事になったためだ。


私がこの国際会議にポスターの要旨を提出したのが2月末であり、そのときはまだこのような自体が想定されていなかった。そこから、Virtual meetingになることが通知され、（参加費を2万円弱まで抑えた上で）実際に開催されたのだから、研究所の事務方は極めて優秀である。状況から察するに、彼らも全員リモートで働いているようだった。


会議は4-5日間にわたって行われ、トークセッションはZoomで行われ、ポスターセッションやトークに対しての質問はSlackで行われた。本来はZoomにもチャット機能はあるが、Zoomは動画を配信するだけのサービスとして運用することを選んだようだった。Slackにもビデオ機能はあるが、参加者のマイクを強制的にオフにする等の非対称的な機能が（おそらく）実装されていないため、使用を避けたようだった。


トークセッションは日本時間の夜中に始まり、早朝に終わるように組まれていた。最後の日を除き、20分程度のトークが8回が1セッションで、1日2セッションずつ組まれていた。最終日はCSHLから打診を受けた人が40分のトークを行ったり、COVID19に関しての最先端の解析結果が話されていた。参加者のタイムゾーンはニューヨーク等のアメリカ東海岸側のものが多かったが、ヨーロッパや一部中国の研究室からもアクセスがあったように見受けられた。ポスターセッションは、各ポスターごとにSlackチャンネルが作られ、ポスターの質問があるものは各自チャンネルにアクセスすると言った形だった。


全体としては、Zoomのビデオ会議を行うことで、ビデオを『見なくてはいけない』という力が強くなったように思う。Zoomでどこからでも見られるようになった結果、むしろ他の人が話しているときに、平気でSlackのポスターセッションに書き込むのは、やや横柄な（Rudeな）印象を与えるのかもしれない。特に、前回の参加の時は、最終日のセッションは――かなり失礼な言い方をすると――暇なやつが聞くもので、忙しい研究室のPIはさっそく帰ったり、別のPIと情報交換をしたり、はたまたポスターセッションに行って院生をからかったりしていた。このような現象は、少なくとも私には見受けられなかった。


一方で、このような状況は、ある程度、事務方も想定したようで、いつもは食堂やコーヒー置き場で話されていたような、「お前、来年からうちでポスドクしない？」とか、「働きたいんやけど、バイオインフォマティクスってお金なんぼ稼げるんねんな」というような会話をするためのチャンネルが作られ、半強制的に参加させられていた（記憶によれば。もしかしたら違ったかもしれない）。



さて、これは何の法的根拠もないが、この会議で話されたことを（日本語であっても）誰でも閲覧可能な形で書くのは個人的なモラリティに反する。ほとんど全てのトークがTweetable（ツイート可）に指定されていたが、それは研究者同士の交流のためにあるのであって、本ブログのようなもののためには開かれていないだろう。ここでは私が特におもしろいと思った発表（のリンク）を2つ張っておく。


まずはStanfordでCSをやっていて、ENCODEというプロジェクトの『エラい人』であるAnshul Kundajeが話していた事で、[Deep learning at base-resolution reveals cis-regulatory motif syntax](https://www.biorxiv.org/content/10.1101/737981v2.full)だ。話は簡単で、Deep learningを用いることで、ある配列にどのくらいある種類の転移因子がくっつきやすいかのスコアを出力する、というものだ。スカラー値を出力するのではなく、例えば、2K bp 入れると 2K 個の『TFがつきそうかどうか』の予測が出てくるのがやや面白い。より面白いのは、これを利用して、広範なパターンを検知できるというところで、例えば、あるモチーフが周期的に現れるということを、**1bpずつ、2つの転移因子を近づけながら予測器に食わせる**ことで発見したりしている。



もう一つは、UCLA（”あの”UCLA？）のSriram Sankararamanが発表していた[A scalable estimator of SNP heritability for Biobank-scale data](https://academic.oup.com/bioinformatics/article/34/13/i187/5045805)というトークだ。これはUK biobankという、イギリスに住む人のゲノム情報とPhenotype（背とか体重とか疾患とかコーヒーを何杯飲むかとか）の巨大なデータベースで、このデータベースサイズでも動くアルゴリズムを開発するという話だった。基本的な数理はほぼ線形代数と統計だが、基本的な数理というのは巨大なデータベースに適用するといつまで経っても終わらなかったりする。この研究は乱択アルゴリズムを用いることで、計算量を本質的に下げて、実際もうまくいく、という話だった。