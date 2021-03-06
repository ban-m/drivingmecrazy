+++
title = "コムギゲノム雑感"
date = 2017-08-23
draft = false
# tags = [ "genomics", "wheat", "sequencing", "genome assembly" ]
# category = "diary"
order = 0
weight = 0
aliases = []
template = "page.html"
[taxonomies]
tags = ["Genome", "Biology", "Genome Biology"]
categories = ["Biology"]

[extra]
+++

## 書くこと

先日、Scienceでコムギのゲノムに関する研究が出版されたのだが、次のような速報で取り沙汰されていた。

<blockquote class="twitter-tweet" data-lang="en"><p lang="ja" dir="ltr">コムギのゲノム、完全解読に初めて成功 <a href="https://t.co/vYzyXelSPa">https://t.co/vYzyXelSPa</a> 異質6倍体であるコムギのゲノムを解読。転写解析も。Science原著↓ <a href="https://t.co/rE2FCQ8qfN">https://t.co/rE2FCQ8qfN</a>   <a href="https://t.co/OiZjFtA6vw">https://t.co/OiZjFtA6vw</a></p>&mdash; 俺のソース (論文紹介) (@OrenoSource) <a href="https://twitter.com/OrenoSource/status/1030290485535887361?ref_src=twsrc%5Etfw">August 17, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

[原著論文](https://doi.org/10.1126/science.aar6089)から辿れるアルトメトリックを見た感じでは、このPostが、日本においては最もRT/Fabされているように見受けられる。

私見では、このPostは、間違ってはいないと思うが、少しざっくり書きすぎだと感じる。具体的には、完全読解を『ゲノムの文字を全て正しく並べる』という意味で使っているなら、コムギのゲノムの完全解読は未だできていない。より一般に、真核多細胞生物のゲノムで、完全解読されているものを、僕は知らない（線虫のゲノムは完全解読されている、と[英版wikipedia](https://en.wikipedia.org/wiki/Caenorhabditis_elegans)には書いてあるが、これは嘘です）。

例えば、コムギは21本*2の染色体を持つが、今回発表されたのは138,665本の配列だ。ゲノムサイズは15.76Gbpだが、上記の138,665本を全て繋いでも、14.5Gbpにしかならない。

ちなみに、植物モデル生物シロイヌナズナは、約140Mbpくらいで、染色体は5本、配列は100本である。


今日は、『ゲノムの文字を正しく並べる』（ゲノムアセンブリを行う、という）ことが何を指しているのか、これまで何がされてきたのか、どんな技術があるか、といった周辺知識を書いておくことで、140字には載り切らなかったであろう情報を補填しておきたい。

一応、確認を取りながら書いていくつもりだが、もちろん、たくさん間違いがあると思うので、見つけ次第、Twitterやメールで教えていただけると嬉しいです。

<!-- more -->


## ゲノムアセンブリ概観

次の説明で、だいたいわかった人は次に進もう。
名前付けなどは、それが人為的である限り、じっさいどうでもよく、それがどういうものなのかが大切だ。

> ゲノムアセンブリとは、生物のDNAを読んで、読んだ断片から、ゲノム全体を構成することである

<----->

### わからなかった人へ

ゲノムとは何だろうか？
英語が苦にならない人は、Plos Geneticsに[『What is a genome?』]( https://doi.org/10.1371/journal.pgen.1006181)という、そのまますぎる論文が上がっているので読めばいいが、
端的に言うと、『ある生命における全ての遺伝的構成要素』だ。
もちろん、読者諸氏は染色体がなんたるか、DNAがなんたるかについて知っていると思うので、
それらの用語を使うと、次のThe molecluar biology of the cellに載っている次の定義になる。
> *Genome*:
> The totality of genetic information belonging to a cell or an organisms; in particular, the DNA that carries this information.

『細胞や個体に属している遺伝的情報の全てで、特にこの情報を運んでいるDNA』
ここで、『特に』というところに注目してほしい。多くの場合、これらは完全に同じものだと見なされているが、実際は微妙に違う可能性がある。
まず、DNA以外の遺伝情報はありうる。例えば、卵子の中のタンパク質の配置などは、それが個体の発生に本当に役割を果たしていて、親も同じような経過を辿っているという点を持って、遺伝情報だと言えないだろうか？
また、DNAをA,T,G,Cの並びと捉えるのも、微妙にずれがある。上の引用においては、DNAの化学的な性質や、結合の如何等も当然含まれるのだが、A,T,G,Cの並びについては、そのような情報は捨象されているという点において。

ではゲノムアセンブリとは何だろうか？
ゲノムアセンブリを多数行っているEmsembleというグループの[Glossary](https://asia.ensembl.org/info/website/glossary.html)や[FAQ](https://asia.ensembl.org/Help/Faq?id=216)を見ると、次のように書いてある。

> The genome assembly is simply the genome sequence produced after chromosomes have been fragmented, those fragments have been sequenced, and the resulting sequences have been put back together.

（ゲノムアセンブリとは、染色体をバラバラにほぐして、その断片を読んで、読んだものを元通りに合わせることで作られた、単なるゲノム配列のことである）

または、

> A computational representation of the sequence of a haploid genome, representative of a species or strain.

（種や株の代表となる、半数体のゲノムの配列の、計算機的な表現）

ここで、更に微妙なずれが導入されていることには、簡単に気がつけると僕は思う。例えば、

- 2n、nの核相を持つヒトなどの生物では、nの核相しかもたない菌などの生物と違い、全ての遺伝情報という言葉の定義が微妙になる（もちろん、我々は精子や卵子のための馬鹿でかいぶよぶよだと考えれば、こんなことはどうでもいいことだ）
- ゲノム配列という言葉はよくわからない。遺伝情報の全ては、配列のように直列化できるのだろうか？
- 種や株のゲノムという言葉はよくわからない。種や株は遺伝情報を伝えるわけがない。遺伝情報を伝えるのは個体であって、それ以外のものではない。

一方で、これらは（私見では）研究室でご飯時にやるべきたぐいの議論だと思う。というのも、 **相同染色体はあまりに似通っているので、だいたい同じ配列だとみなして取り扱うし** (この言葉は後で聞いてくるので、覚えておこう)、ゲノム配列はA,T,G,C上の文字列とみなせるし、同一種内の個体のゲノムはあまりに似通っているので、『ココらへんが違うことがある』という、一種の表を作っておけば十分だから。

ゲノムアセンブリのとっかかりやすいアナロジーとして、本を想像してもらいたい。A,T,G,Cの4文字で書かれた本だ。それを計算機上に、A,T,G,Cとして再現する。やることはただこれだけだ。

<---->

一番確かで、簡単なやり方は、もちろん「最初から1文字ずつ読んで、最後まで読み切る」だ。しかし、この方法は単に **できない**。そのような機械がないからだ。

では、どのような機械を持って、ゲノムアセンブリは行われるのだろうか？　具体的には、どうやってゲノムは読まれて、つなぎ合わせられるのだろうか？

ちなみに、人の半数体ゲノムは、約3,000,000,000文字でできている。

## 短鎖型シーケンサー、あるいはk-mer計数機械

まず、現行のゲノムを読む機械（DNAシークエンサー、単に、シーケンサー）のうち、最も有名かつ使われているのが、illumina社の短鎖（ショートリード）型シークエンサーだ。
僕は販売員ではないので、詳しくは[illumina](https://jp.illumina.com/)社のページを見てもらうことにする（[『ゲノムに夢中』という、やや病的な漫画](https://jp.illumina.com/landing/comic.html)も読める）。

特徴を端的に述べると、次のようになる。

- 一回に読める長さは150文字くらい。（読んだ『文』のことを、リードと呼ぼう）
- 一回の実験で、数百Gbp(塩基対)、つまり300,000,000,000文字くらい読める
- 誤って読む確率は1/1000より小さい

実際は、illumina社のシークエンサーにはいくつか種類があり、特性も異なっているのだが、これらの特徴はだいたいどれも同じだ。

（原理が知りたい人は、次のYouTube動画がおすすめ{{youtube(id="fCd6B5HRaZ8")}}）

本当は、454やSOLiDと言ったシークエンサーを紹介してもいいが、これらはすでに歴史の遺物とみなしても差し支えない。

すぐに気がつくのが、これはほとんど『読んでいる』うちに入らないことだ。
3G文字のうち、たった150字、それもランダムにしか読めない機械を使わざるを得ないことを想像してもらいたい。前述のアナロジーなら、『**同じ本を100冊用意して、シュレッダーにかけて、出てきたゴミを渡されて、「はい、じゃあ元の本に戻してね」**』と言われるようなものだ。

実際、これはゲノムを『読む』というよりは、『ある文字列が何回出てくるかを数える』と言ったほうが近いところまで行っている。

例えば、『リード長がすべて1で、限りなく読めるシーケンサー』を考えよう。これはA,T,G,Cのどれかを出力し続ける機械なのだが、ここから得られるのは、単にA,T,G,Cがどのくらい読まれるかしかない。要するに、

A,A,A,A,T,T,G,G,T,T,C,

と出力されたら、「ああ、このゲノムはAとTが多いんだなあ」（A-Tは相補対なことに注意）と物思いにふけり、

AA.......AAGG....GG

を『アセンブリ』として提出するしかない。同様に、『リード長がkで、限りなく読めるシーケンサー』を考えてみると面白いかもしれない。

（本当は、もう少しパワフルで、『ある断片の、最初と最後の150bpを読める』といったほうが正しいが、あまりにも専門的なので、飛ばす）


当然、誰でも思いつく要求は次のようなものだ：もっと長く読ませろ

## 長鎖型、あるいは信頼できないスキャナ

現在、長く読めるシーケンサーには、2種類あり、それぞれ、[PacBio](https://www.pacb.com/)と[Oxford Nanopore Technology](https://nanoporetech.com/)が開発している。
開発されたのは最近で、PacBioはようやく『PacBioとタイトルに書いただけでは通らなくなった』状態、nanoporeはまだ、nanoporeと書いただけで論文が出やすくなる状態だ。利益相反に当たる可能性があるので、詳しいことは避けるが、

動作原理は

PacBio
{{youtube(id="NHCJ8PtYCFc")}}

Oxford Nanopore Technology
{{youtube(id="GUb1TZvMWsw")}}

で見ることができる。

特徴としては、

- 一回に読める長さは20,000bpくらい。PacBioは長いと200,000bpくらいまで、Nanoporeは1,000,000bpくらいまで読める
- 一回の実験で、数Gbp-10数Gbpくらい読める
- エラー率は10-15-20％くらい、Nanoporeはもう少し悪い。

となる。今まで、150bpで耐えていたのが馬鹿らしくなるほどの進歩だ。もちろん、ヒト一番染色体250,000,000bpを読むためには250倍くらい足りないのだが、それでも進歩には違いない。

ただ、エラー率に注目してもらいたい。もちろん、エラー率をどのように定義するかは問題だが、読んだ塩基のうち、1.別の塩基と間違えた 2.存在しない塩基を読んだふりをした 3.存在する塩基を読み飛ばした 割合だと思ってもらおう（本当はこうではないが、ちゃんと説明しようとするとアラインメントの説明をしないといけない）。

エラー率15％というのが、どれほど間違えるかというと、『エれー率15％といのが、どれほど間えるかまという』くらい間違える。
実際、この意味で、長鎖型のシーケンサーというのは、カウンタマシンというよりは、むしろ、信頼性のないスキャナとでも言うべきものだ。

実際、同じところを何度も読むことが**できれば**、多数決を取ることで、読んだ回数に対して指数的にエラー確率が下がっていくので、訂正をすることができる。

（問題：ある文字列に対して、そこのランダムなk-長の文字列を読めたとする。こうやって読んだ、二つのk-長の文字列同士が、同じところから出てくると、どうやったら確証できるだろうか？　l文字が異なる場所で一致する確率は、1/4^l、と言うのは間違えている。実際、Aのみからなる文字列から切り出せる、k-長の文字列は、一通りしかない。）


## 遥かコムギゲノム

では、これら2つのシーケンサーを用いて、コムギのゲノムアセンブリはできたのだろうか？

答え：できていない


この理由を説明するには、コムギの来歴について、少し説明する必要がある。

まず、コムギは非常によく似た3つの種が、混ざり合ってできているものだという事実がある。より具体的には、コムギは(2nのとき)、

- A1A1-A7A7という7本の染色体をもった種
- B1B1-B7B7という7本の染色体をもった種
- D1D1-D7D7という7本の染色体をもった種

が、染色体を失うことなく、新しい種を構成している。つまり、文字で書くと、

A1A1 A2A2 A3A3 A4A4 A5A5 A6A6 A7A7

B1B1 B2B2 B3B3 B4B4 B5B5 B6B6 B7B7

D1D1 D2D2 D3D3 D4D4 D5D5 D6D6 D7D7

というとんでもない数の染色体を要していて、Ad,Bd,Dd同士(d=1,...,7)、95％くらいの類似度を持つ。
考えて見て欲しいのだが、10%くらいエラーを起こす長鎖型のシークエンサーを使って、これら三種類の染色体を区別することはできるのだろうか？　それは単に、エラーに紛れ込んでしまうのではないか？

（実際はそれほど悲観することではないように思われる。エラーはランダムに入るのだが、Ad,Bd,Dd間の差異は固定されている。）

さらに状況を悪化させるのが、植物ゲノムは特にそうなのだが、同じ配列が非常に多いことが挙げられる。
これは転移因子という、ゲノム中で自己複製する配列のせいだ。

（これは具体的にどのくらい、と書けないのがわかるだろうか？　研究によっては、コムギゲノムの約80％が、このような転移因子や、その名残であると結論づけているが、これは不完全なアセンブリに頼った推定であり、実際はもう少し多いだろう。）

また、より一般に、多くの真核生物は、染色体の中央にセントロメアと呼ばれる反復配列を持っていて、どのようになっているかというと、

[unit] = (160字くらいの、A,T,G,Cからなる文字列)

[unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit][unit]


こういう感じだ(本当は数Mbpくらいある)。更に、リボソーム16Sをコードしているゲノム中の領域があり、同じようになっている。

これのせいで、短鎖型のシークエンサーは非常な困難に直面する。例えば、上記の[unit]を読めたとして、それが何番目の[unit]なのかを知るのはほぼ不可能だ。実際には、目標はもう少し簡単で、繰り返し回数だけを知ればいいのだが、これも、同じ反復配列が二箇所にあった場合、困難が発生する。

系：上のゲノムから、短鎖型リードで得られたアセンブリについて、それの正しさは示せない

長鎖型のシーケンサーを用いて、リピート領域を跨いでスキャンすればよいと言う意見もあり、実際、それによってかなりの量のリピート領域が埋められているが、Mbpレベルのリピートを埋めることは、今だにできていない。

（このようなリピート領域を、一般に『ゲノムの複雑性が**低い** 領域』と言う。たまに、ゲノムが **複雑で難しい** と言われるが、実際は、ゲノムが単純であればあるほど、アセンブリは困難になる。例えば、『3ギガ文字のAの中に、4つだけCがある』なるゲノムのアセンブリは、ほとんど不可能に近い。 ）


更に、コムギはゲノムサイズが大きく(半数体で16Gbp)、長鎖型シークエンサーのみで、エラーを訂正するのに十分と言われているX30(同じところを30回読む)を達成するために、500Gbp近いリードが必要になる。

このような理由で、完全なアセンブリと言うのは、未だにどの真核多細胞生物においても成功していない。

ところで、ヘッダーの下に引用文献をつけるが、正しいかは微妙だ。Mendeleyに言って欲しい。

### 1度めのアセンブリ：遺伝子アセンブリ
Brenchley, R., Spannagl, M., Pfeifer, M., Barker, G. L. A., D’Amore, R., Allen, A. M., … Hall, N. (2012). Analysis of the bread wheat genome using whole-genome shotgun sequencing. Nature. https://doi.org/10.1038/nature11650

これは全文がタダで読める。読む価値があるかは知らない。

2012年は、まだ短鎖型シーケンサーしか実用的ではなかった頃だ。アセンブリを行う際には、あるリードと、それと80bp程度完全に一致する別のリードを用いて、

<------>.....   
...<------->.....    
.........<------>....   

と言うように繋いでいく。もう少しわかりやすく言うと、

- と言うように繋
- うに繋いで
- 繋いでいく。もう
- 。もう少しわかりやすく言うと、

と言う文字列から、『と言うように繋いでいく。もう少しわかりやすく言うと、
』を構成するようなものだ。

先に述べたように、この状態では、使うアルゴリズムにもよるが、リピート領域に入るたびに、アセンブリは途切れてしまう。結果として、非常に断片化した、平均長が数百bpのアセンブリが大量に生成される。

もちろん、これは全体でも数百Mbpしかなく（本来なら、17Gbp程度出るはずだったことを思い出そう）、A1-D7のどの配列から来たのかもわからない（もしかしたら、途中まではA3で、そこからD3に切り替わっているかもしれない。ちょうど、同じ『文』が登場したことで、ある二つの文章が切り替わってしまうのと同じように）。

実際、アセンブリの前段階で、リピートと思しきリードや、rDNAの反復配列あたりから来たリードを取り除く工程が入っているが、これで、全体の60%近くが失われたとSupplementary noteに書いてある。


この論文では、（私見では、やや苦し紛れに）染色体A、B、Dから進化した別の種のゲノムアセンブリA',B',D'――これも不完全なのだが――を使って、『手に入った断片を、A',B',D'のどれに属しそうか見て、それを実際の帰属とみなす』と言う手段を用いている。例えば、ある断片が、B'の中やD'の中よりも、A'の中に、近い文字列があるならば、この断片は実際にAという染色体から来たと思う、という具合だ。実際は、一番染色体だけはA,B,Dの帰属がわかっているようなので、それを正解セットとして用いて、SVMを用いて機械学習をしているらしい（サプリ5.1に載っているが、やや意味不明な記述が多い。特に、使っているカーネル関数が明記されていないのだが……）。

もちろん、このような手法が一般にうまくいくとは限らず、Precision、Recallともに6割程度の結果になっている。コインフリップでも33%の正答率が出せることを考えると、かなり微妙だ……。

また、細胞からRNA/m-RNAを抽出して、cDNAを作成、それのシークエンシングを行なっているが、得られたリードの総数は1.6Gbpとなっている。また、各部位からRNAを取って来ているようだが、細胞種ごとの解析は行われていない。

結局、この論文でできたことは
- 85Gbp のデータセットから、非常に短い、ゲノムの断片を作れた（5,321,847個の断片で、全長3.8Gbp、平均長は715bp,N50=884bp）
- どの染色体へ帰属しているかは、かなり怪しい
- RNAを用いた遺伝子コード領域の推定も行われているが、データセットが小さすぎる。（遺伝子数を94,000-96,000と予測）
- 使用ソフトウェア:[Newbler](https://swes.cals.arizona.edu/maier_lab/kartchner/documentation/index.php/home/docs/newbler)

N50とは、『アセンブルされた配列を、長い方からconcat していって、総長の半分に到達した時の、さっきconcat した配列の長さ』のことだ。このようなメトリックがなぜ使われているか、私は知らない。（簡単な計算から、N50 > (平均長)という関係が導かれる。『数字がでかいと強い』理論では、N50の方が、平均長より強いことがわかる。）

### 2度目のアセンブリ：染色体ごとのアセンブリ
Mayer, K. F. X., Rogers, J., Dole el, J., Pozniak, C., Eversole, K., Feuillet, C., … Praud, S. (2014). A chromosome-based draft sequence of the hexaploid bread wheat (Triticum aestivum) genome. Science, 345(6194), 1251788–1251788. https://doi.org/10.1126/science.1251788
（これはジェネラルなアクセス権では、全文は読めない。やっぱりAAASって）

さて、すぐに考えつくこととして、次のようなことがある：染色体ごとにシークエンスすればいいのではないか？

実際、このアイディアは実行に移され、先ほどの論文から2年後には、B3のリファレンスゲノムが、同年には全ての染色体が読まれた。
具体的には、フローソーティングの技術を用いて、21*2本の染色体を、相同染色体ごとに分別し（にわかには信じがたいが、そう言うことができると書いてある）、それぞれのフラクションを読み、同じプログラムでアセンブルを行なっている。シークエンシングセンターは世界7つの研究機関に分散し、それぞれillumina社のシーケンサーを用いていた。（どうしても知りたい人のために言うと、日本はB6染色体のシークエンスを行なった）

データセットしては、最低X30(同じところを平均して30回読んでいる。例えば、3Gbpのゲノムなら、90Gbp読むことに相当する）の深さでシーケンシングを行なっている。A4の短い方の腕（染色体はセントロメアを中心として、長い腕と短い腕に分けられる）に至っては、X241の深さで読んでいる。
面倒臭いので、真面目に計算をしていないが、サプリを読む限り、全体として、 900 Gbp は最低でも読んでいるように思われる。これは圧縮せずに表現すると、binaryの表現でも1.8Tbyteに対応する。

また、遺伝子発現のデータも、葉、根等、五箇所から合計62Gbpシークエンスを行なっている（短鎖で）。遺伝子のコード領域の予測は、他の植物の遺伝子との相同性検索w/ 遺伝子発現データによる確証で決定している。

さて、論文の結果をまとめよう。ただし、どういうわけか、ゲノム全体に対するメトリックが無い（知っている人は教えてください）。

- 数Tbp のデータセットから、短い、ゲノムの断片を作れた（リピート領域を取り除いた状態で、約1400,000個の断片で、全長10.2379Gbp、N50は1000bp-3000bp程度）
- どの染色体へ帰属しているかは、厳密に決定できている。
- RNA-seqのデータから、遺伝子領域の予測をしている。遺伝子数は（遺伝子座やalternative splicing を含むかどうか、など、メトリックが多すぎて意味不明になっているが）だいたい133,090個程度。
- 使用ソフトウェア:[Abyss](https://github.com/bcgsc/abyss)


（蛇足だが、L50(bp)という、単位がかなり意味不明な列が表にあるが、これはきっとN50のことだろう。L50と言うのは、N50を計算するときにconcat した配列の数のことである。このメトリックが一体何の役に立つのか、私にはわからない）


### 3度目のアセンブリ：物量戦
Chapman, J. A., Mascher, M., Buluç, A., Barry, K., Georganas, E., Session, A., … Rokhsar, D. S. (2015). A whole-genome shotgun approach for assembling and anchoring the hexaploid bread wheat genome. Genome Biology. https://doi.org/10.1186/s13059-015-0582-8
これはタダで読める。

今回は、前回のような、染色体ごとのシーケンスではなく、全ゲノムを読んで、アセンブルをすることにしている。
キーポイントは、コムギの異なる株をかけ合わせたものを大量に読むことで、遺伝地図（組み換え価を距離と見たときの地図）を作り、それを用いて、アセンブルした配列を
染色体として並べる技術らしいのだが、私の遺伝学の知識が薄く、何を言っているのかよくわからない。
もし、識者の方がいらっしゃれば、参考文献を教えていただけると嬉しいです。

簡単にメトリックをまとめておく。

- データセットは約3Tbp。うち、アセンブリに使われるのは500Gbpで、残りは遺伝子地図を作成するのに使用される。配列は8,141,183個で7.883 Gbp、平均長は968bp
- 染色体への帰属は、遺伝子地図を用いて行った。上記の染色体ごとのアセンブリと比べても、ほとんど同一のアセンブリ結果が得られた
- 使用ソフトウェア:[Meraculous](https://jgi.doe.gov/data-and-tools/meraculous/)



### 4度目のアセンブリ：長鎖シークエンサー
Clavijo, B. J., Venturini, L., Schudoma, C., Accinelli, G. G., Kaithakottil, G., Wright, J., … Clark, M. D. (2017). An improved assembly and annotation of the allohexaploid wheat genome identifies complete families of agronomic genes and provides genomic evidence for chromosomal translocations. Genome Research. https://doi.org/10.1101/gr.217117.116

今回もillumina 短鎖型シークエンサーがメインだが、前述のPacBioシークエンサーが加わった。当然、エラー率がそのままでは高すぎて、アセンブリ目的としては使えないので、転写解析（具体的にはRNAをcDNAに変換して、それをシーケンスする）に使っている。この解析の強力なところは、RNAを断片化せず、全長を読めるところだ。

使うデータもillumina の250bp*2 に切り替わり、アルゴリズムも二段階でde Brujin Graphを構成するものに改善された。結果として、

- X101、つまりだいたい1.8Tbpくらいの短鎖リードのデータセットからアセンブリ。3,000,000個程度の配列が得られ、N50は16700bp。
- 染色体への帰属は、2014年の染色体ごとのアセンブリから得られたデータを元に決定。
- cDNAをPacBioで読むことで、少なくとも104,091個の遺伝子を発見し、1万個の非コードRNAを発見
- 使用ソフトウェア:[w2rap-contigger](https://github.com/bioinfologics/w2rap-contigger)


### 5度目のアセンブリ：長鎖シークエンサーv2
Zimin, A. V., Puiu, D., Hall, R., Kingan, S., Clavijo, B. J., & Salzberg, S. L. (2017). The first near-complete assembly of the hexaploid bread wheat genome, Triticum aestivum. GigaScience. https://doi.org/10.1093/gigascience/gix097

前回のアセンブリは、遺伝子の発見にしか使っていなかったが、要するにエラー率が悪いわけだった。つまり、何らかの方法で、エラー率を補正できれば……。

方法:短鎖型のリードを、長鎖型のリードに『貼り付け』て、置き換える。

（正直言って、これがなぜできるのかやや不明だが、）短鎖型のリードをある程度組み合わせ、それらをさらに長鎖型リードに組み込む方法をこの論文では採用している。

この『タイリング』のあとは、それら長いリードを重ねていくと言う手法を採用して、アセンブリを行う。本論文では、さらに、長いリードのみから構成するアセンブリを組み合わせることで、配列長を伸ばして行っている。

残念ながら、染色体への帰属を決定することはできなかったが、AABBDDのうち、もっとも相同性が高いDDを持つ別種の植物のゲノムを用いて、決定している。

- 1Tbpのillumina リードと545 Gbp のPacBioリードを用いた。配列数は279 439個、全サイズは15.3Gbp程度、平均長は54Kbp,N50は232Kbp
- 染色体へのアサインメントはDのみ。Dも、一番最初の論文と同様に、近縁種を用いて確定しているのみ。
- 転写解析は無し
- 使用ソフトウェア:[MaSuRCA](https://github.com/alekseyzimin/masurca)



### 6度目のアセンブリ：deNovoMagic2
Appels, R., Eversole, K., Feuillet, C., Keller, B., Rogers, J., Stein, N., … Uauy, C. (2018). Shifting the limits in wheat research and breeding using a fully annotated reference genome. Science, 361(6403), eaar7191. https://doi.org/10.1126/science.aar7191

さて、どれだけ人類が頑張ってたかが草のゲノムに必死こいてきたかわかると思う。わずか100文字のリードを集めて、他のゲノムを使って、遺伝子のようなものを、カスみたいなSVMで分配していた頃から、PacBioの20,000文字ものリードを集めて、やっと15Gbp程度のアセンブリまでやってきた。また、これまでの論文は、基本的に全てオープンソースのソフトウェアで、その気になればソースコードを全て読むことができる。

今回のゲノムアセンブリは、**3.7Tb**のデータを、市販のソフトウェアでアセンブリすることによって達成されている。
これがどう言うことかと言うと、おそらく、長鎖型で必死にやっている研究者より、旧来の短鎖型シーケンサーのデータを使っている、商業でゲノムアセンブリをやっている人の方が、アセンブリの点においては優れていると言う評価だ。

（実際にゲノムを使う立場からすると、こんなことはどうでもよく、正しそうなアセンブリがいい感じに長ければいいわけだが、バイオインフォをやっている身からすると、よくわからないソフトを使いたくないと言うのが正直なところだ。サプリを読むと、アルゴリズムのワークフローだけは書いてあるのだが……。）

ただ、こうやって構築された配列（やscaffold:後述）を染色体に分けるときは、BAC（染色体ごとに分けたコムギゲノムを、バラバラにして、大腸菌のゲノムに組み込んだもの）を用いたり、Bionano optical mapping（いつかエントリを書く）等を用いている。

発現解析についても、PacBioではなく、illuminaを用いて行なっている。ちょっと面白いのが、この発現解析、今までpublish された529個のRNA-seqデータと、新しく読んだ321個のRNA-seqデータを用いているのだが、この新しく読んだ321個のうち、209個が発生の過程での各段階を取ったものだ。

つまり、この研究では、植物の発生が進につれ、何か面白いことが（RNA-seqの解像度で）わかるだろうという作業仮説のもと、始められたようなのだが、実際の論文には、アブストラクトにはそれを匂わせる記述があるものの、本文にはそのような記述はあまりない。

要するに、この論文は、 **長鎖型で、新しいアルゴリズムを開発すればいけると思っていたが、実際は短鎖型＆市販のソフトウェアの方が良かったし、何かわかると思っていた発生段階のRNA-seqもあんまり芳しい結果が出なかった**というのが、裏の話だと思ってしまう（流石に、私の脳がゴシップ的なのもあるが……）。


メトリックまとめ

- 3.7Tb のillumina リードから、685,085個の配列で、合計14GbpのN50=51,840のコンティグを作成
- 染色体への分配は、BACやHi-C等を用いて行なった
- 発現解析もRNAをcDNAに変換して、illumina でシーケンス。


## 感想

ところで、結果として手に入ったのは、685,085個の配列で、位置の情報を入れて、間に『よくわからない』塩基Nを許しても、138,665個もの配列が手に入った。本当は、染色体は21本*2しかないことを思い出そう。一体これはどういうことなのか。

不思議ですね。


### アセンブラについて

アセンブリのアルゴリズムとその実装（アセンブラ）について、全く紙幅が避けなかった。実際、ゲノムアセンブリを、『与えられたリードを、全て、部分文字列として含む文字列を作るアルゴリズム』と言うのはあまりにも馬鹿げている（単にリードを全て concat すればいいだけ！）。

ただ、短鎖型のリードを使ったアセンブリには、いくつかグラフ理論の道具を使わないといけないし、長鎖型アセンブリにおいては、現状、必須になっている、アラインメントや現代的なヒューリスティックについて説明する必要があり、これは2、3回に分けて説明するべき問題だ。

本来は解説するべきジャーゴンについて、解説できなかった。例えば、現代ではHi-Cと呼ばれる技術や、Optical mappingと呼ばれる技術を使って、塩基単位ではないものの、大域的なゲノムの情報を手に入れることができる（ココらへんとココらへんが近い/遠い、など）。これによって、『この配列とこの配列は、（間には何があるかわからないが）500,000塩基程度離れている』ということがわかり、アセンブリされた配列たちを並べることができる。

この結果得られた配列を、scaffold と言い、現在ではscaffold 単位での比較をする論文が多いように思われる。

### アセンブリについて

個人的な考えでは、アセンブリとはある種の点推定で、それは与えられたリードと、推定されるゲノムの性質を、うまく説明するような文字列を推定することにほかならない。

当然、この流れを汲んで、ある種の分布としてゲノムを捉え直す、グラフゲノムという主張もあるようだが、うまく行っているかは知らない。

また、ゲノムアセンブリを元にして、真のゲノムの性質について何かを言うときには、かなり気をつけなければならない。例えば、その性質は、使っているアルゴリズムの特性を描写しているにすぎない可能性もある。

これと関連して、アセンブリについて、『Super string problemなのでNP困難』という主張があるが、これはかなり微妙なところがある。多くの場合、Super string problemは、解きたい問題ではない。

### ゲノムについて

また、純粋に生物学的な解説ができなかったのが悔やまれる。例えば、A,B,Dという3つのよく似た染色体は、どのような進化を辿っているのだろうか？　何らかの意味で、ゲノムの中で『強い』ものがあったりするのだろうか？　リピート領域が多いと言ったが、各染色体で、多いリピートには特色があるのだろうか？


私見では、アセンブリされたゲノムは、ある種を記述するだけでなく、『座標系』としても機能していると考えている。例えば、ヒトゲノム中のある遺伝子の疾患を示したいときに、『これこれという名前のタンパク質をコードしている部分で』や、『ここの遺伝子の近くの非コード領域で』などというより、『このアセンブリで言うと、ここ』と言ったほうが、簡便だ。

何が言いたいかというと、ゲノムを使うときには、ゲノムそのものに興味がある場合と、ゲノムを単なる記述のためのツールとして使う場合があり、多くのゲノムアセンブリは、後者を目指してやっているのだが、この2つは、現在、混同して用いられているようだ。


### 主張

どうでもいいが、バイオインフォマティクスの発展、優秀な学生の流入を亢進させるために、もっとこのようなエントリを **日本語で** 書いていくべきだと僕は感じている。

バイオインフォマティクスの人口を増やすためには、今の頭のいい高校生に、たくさんバイオインフォマティクスのことを認知してもらうことが寛容と思われる。
更に、日本にそのような研究をしている場所があることを知ってもらうことも必要だ。
もちろん、本邦の現状の英語教育では、才能や学力のある若者全員が、英語の記事を抵抗なく読めるようにはできていないので、日本語によって書くことが求められていると思う。

確かに、僕の周辺では、『結局、研究をするときは英語で読み書きするんだから、日本語でやっても無駄』という意見が時折聞かれる。
しかし、これは書くことの目的を取り違えている。僕は、業界の中のためにのみならず、布教のために書いているのだから。

