+++
title = "Bi-directional Burrows Wheeler Transformationまでの道（3）：Suffix Tree"
date = 2020-04-25
draft = true
tags = []
order = 0
weight = 0
aliases = []
template = "page.html"
[taxonomies]
tags = ["Suffix Tree", "Algorithm", "Bioinformatics"]
categories = ["Bioinformatics"]
[extra]

+++


# これは何？

生物情報科学でごく希に出てくるデータ構造でbi-directional Burrows Wheeler Index(双方向バロウズウィーラー索引)というものがある。これは与えられた文字列内で繰り返し出てくる配列を高速に求められることと、やたらアルゴリズムがだるいことで知られている。

このシリーズはbi-directional Burrow Wheeler Indexを実装することを目的に、周辺のデータ構造を合わせて解説するシリーズにする予定であり、本稿はそれの第3回に当たる。

<!-- more --> 

# 参考文献

シリーズを通して

- Mäkinen, V., Belazzougui, D., Cunial, F. and Tomescu, A.I., 2015. Genome-scale algorithm design. Cambridge University Press.

を参考にしている。今回は

- Kasai, T., Lee, G., Arimura, H., Arikawa, S. and Park, K., 2001, July. Linear-time longest-common-prefix computation in suffix arrays and its applications. In Annual Symposium on Combinatorial Pattern Matching (pp. 181-192). Springer, Berlin, Heidelberg.

も参考にした。



# 本文

## 前回の訂正

前回、Suffix Arrayの構築でSuffix Array-Induced sortingを紹介したが、実は[Yuta-Mori's DivSufSort](https://github.com/y-256/libdivsufsort)の方が早いとの連絡を受けた。どうやらそのような場合もあるようなので、ここに追記する。

情報を教えてくれた方にここで感謝します。ありがとうございます。

## はじめに

さて、[前回](./../suffix_array2)はSuffix Arrayの線形構築をした。これで、ある程度高速にSuffix Arrayを構築できて、ある程度の時間で文字列検索が出来るようになったのだが、実は『ドキュメントに対して文字列があるかを検索する』というのではない応用例もある。

例えば、コードを書いて、その中で冗長なコードがあるかを探したいというモチベーションは誰にでもあるだろう（保守がしやすくなるため）。そのような場合、ソースコードの中に繰り返して現れる文字列を検索したい、という問題だと定式化できる。

ほかにも、ゲノムの中に同じように繰り返す配列がどのくらいあるかを調べたいということもあろう。例えば、転移因子の解析や、アラインメントの際に偽陽性を生んでしまうリピートの検出等だ[^1]。

つまり、

- 入力：文字列
- 出力：繰り返している文字列の場所たちと長さ（位置を表す整数のベクタと、繰り返し長を返す）

ただ、この『繰り返している』という言葉の定義は直感的には分かるものの、実はそんなに簡単でないことが分かる。つまり、

AAACTCAAACTCAAACTG

という文字列があった場合、繰り返している文字列は`AAACT`なのだろうか？　それとも`AAACTC`なのだろうか？　後者だという場合、なぜ前者は繰り返していると言えないのだろうか？　後者も含めると言った場合、`AAA`も繰り返しになるのではないだろうか？

つまり、我々は最大リピートの定義から議論を始めた方がよかろう。


[^1]: 専門家以外にはつらい表現だが、そういう問題があるくらいに思ってほしい。


## 内容：繰り返し配列とSuffix Tree

さて、今後、繰り返している文字列のことをリピートと言ったり、反復配列とかいたり、繰り返し文字列と書くが、意味は全て同じである。それは文字列の中で二回以上繰り返している部分文字列のことだ。

先ほどの`AAACTCAAACTCAAACTG`で言えば、`AAACT`も`AAACTC`もリピートである。何なら`AAACTCAAACT`も重なっているが繰り返しているのでリピートである。何なら`A`も`C`も`T`も`G`もおけらもあめんぼも繰り返している[^1]。

そうはいっても、`A`を出力して「繰り返しです」と言われても少し困る。なぜかというと、もっと頑張れるからだ。`AA`は`A`があるところなら**どこでも**見つかる。`AA`を出力すれば`A`なんて出さなくてもいい。これが**右/左最大反復(right/left-maximal repeat)**の定義である。つまり、

### 右/左最大反復配列(Right/left-maximal repeat)

ある文字列\\(T\\)に対して、文字列\\(x\\)が右/左最大であるとは、\\(x\\)が\\(T\\)の部分文字列として二回以上現れ、それら部分文字列の全てを右/左に伸ばすことが出来ないという事である。

もう少し簡単に言えば、\\(T\\)に対して、文字列\\(x\\)がある場所を全て列挙して、それらの一つ前の文字が全部同じなら、それは左最大ではない。具体的に言えば、`AAACTCAAACTAAACTG`においては、`AAAC`は左最大ではないが（`AAAC`は全て`AAACT`の形で出てくるので、左に一つ伸ばせる）、`AAACT`は左最大である（`AAACTC`か`AAACTG`の二つの形がある）。

もちろん、最大反復配列とは、右最大でも左最大でもある反復配列のことである。

さて、ではそんなのどうやって求めるんだという話でもある。クエリとか文書とかそういうレベルの話ではないことは分かる。

ただ、Suffix Arrayを眺めると、各接尾辞が辞書順にソートされているので、繰り返している文字列を列挙するのは簡単に見える。馬鹿ほど出てくるが、`AAACTCAAACTAAACTG`のSuffix Arrayを書くと、

- AAACTCAAACTAAACTG$
- AACTCAAACTAAACTG$
- ACTCAAACTAAACTG$
- CTCAAACTAAACTG$
- TCAAACTAAACTG$
- CAAACTAAACTG$
- AAACTAAACTG$
- AACTAAACTG$
- ACTAAACTG$
- CTAAACTG$
- TAAACTG$
- AAACTG$
- AACTG$
- ACTG$
- CTG$
- TG$
- G$
- $

が

- $
- AAACTCAAACTAAACTG$
- AAACTAAACTG$
- AAACTG$
- AACTCAAACTAAACTG$
- AACTAAACTG$
- AACTG$
- ACTCAAACTAAACTG$
- ACTAAACTG$
- ACTG$
- CAAACTAAACTG$
- CTAAACTG$
- CTCAAACTAAACTG$
- CTG$
- G$
- TAAACTG$
- TCAAACTAAACTG$
- TG$

になるので[^2]、なんとなく`AAACT`が最初に出てくるし、`ACT`もそれっぽいなあとか思える。ならそのようにデータ構造を作ってみよう。

つまり、これらの接尾辞たちを**できるかぎりマージしながら**木構造を作っていく。そして、葉としてはこれらの接尾辞にたどり着くようにしよう。絵で描くと次のようなものを作る。



専門的には、これはコンパクトトライと言われるが、どうでもいい。

この構築は簡単である。


途中の木は次のようになる。

さて、このLCP配列というものだが、次のようなアルゴリズムで作ることができる。

図で表すとこんな感じである。


やっと我々は最大反復配列までたどり着くことができた。Suffix Treeの各接点が右最大であることを考えると、我々は左最大性をチェックすればいいことになる。

毎度のことだが、前回の例で描くと、次のようにPrevをふることになる。


あなたも最大反復配列が検知できるだろうか？


------

[^1]: 当然、最後の二つは繰り返していない。もちろん、いのちの輪廻の観点から見れば、これは繰り返している。

[^2]: これは卑劣な行数稼ぎではない。