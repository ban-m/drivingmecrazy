+++
title = "BitVectorとWavelet木"
date = 2020-05-01
draft = false
order = 0
weight = 0
aliases = []
template = "page.html"
[taxonomies]
tags = []
categories = []
[extra]

+++

# これは何

BitVectorとWavelet木の簡単バージョン。今回はBitVectorをやる。

<!-- more -->

# 内容


## 前置き

この世にはBitVector（ビットベクトル）とWavelet木（ウェーブレット木）というものが存在する。するったらする。

どういう時に使うかというと、例えば活動量計でを一定時間ごとに『起きてるかどうか』を記録して、ついに100万件もデータを集めてしまったとする。このとき、例えば、ある時刻\\(t\\)までに何回起きていたかとか、\\(n\\)回目に起きたのはいつかとかが、最近寝過ぎだなみたいな気持ちの時に計算したくなる。

まあほかにも色々、BitVectorを使いたいときがある。例えば、塩基が[^1]ある部分までに何回起きているのか気になったりする。ある遺伝子領域で何回Cが出てくるかとか、そういうのだ。

このときに、単に01ビットを並べて、調べてもいいわけだが、実はもっと賢いやり方がある。この発展系で、01の値でなくて、有限の集合の要素が有限個並んでいるときに、同じノリで演算をしたいことがあり、それがWavelet木と呼ばれているやつだ。

## 本題

### はじめに

要するに、我々のやりたいのは、

```math
\text{rank}_x(T,i) = \text{The number of occurence of } x \text{in }T[..i]\\
\text{select}_x(T,i) = \text{The position of the } i \text{-th }x
```

という二つの演算だ。上のrankというやつが、『あるところまでで何回出てくるか』で、selectというやつが『何回目に起きたのはどこか』というやつだ。LaTeXの\text{}で囲うのが面倒なので、ときどきrとかsとか書くことにする。

さて、一番簡単な解決策は、最初に全部計算してしまうというやつだ。rankもselectも、\\(x =　0,1\\)に対して全部計算してしまえば、とにかく\\(O(1)\\)で済む。より強く、一回メモリアクセスをすればいい。簡単。

以上でBitVectorの実装は終わると言いたいが、実はここからが面倒だ。というのも、`n`長のBitVectorをつくると、RankとSelectは一要素につき\\(\log_2 n \\)くらいのビットを使うので、メモリを\\(n \log n \\)くらい食うことになる。正直これは厳しい。

もうちょっとシリアスに言うとこうだ。もし、8G個、極めて雑に言うと\\(2^33\\)くらいのデータがあったとしよう。全部1が立っていたら、rankは最大で\\(2^33\\)だし、selectも\\(2^33\\)を取り得る。なので、rank, selectには64bitを使うことになる。よって、\\(rank_1\\)の実装に、メモリとしてはだいたい\\(64 * 2^33 = 512\\)G bitくらいのメモリを使うことになる。こんなのを馬鹿ほどアロケートしたら、 突然、怖い先輩がやってきて、

お前ちょっと来いよ。お前の投げたジョブがOOMで死にまくるから、なんか俺のジョブもKillされてんだよ。どうしてくれんだ。詫びろ。詫びて1000塩基x1000塩基のグローバルアラインメントを手で計算しろ。

となりかねない[^2]。このような状態を避けるために、rankやselectを小さいメモリで、定数時間でなんとかする、という分野があり、**簡潔データ構造**なる名前で呼ばれている。

一方で、平凡なプログラマであるところの私には、正直めんどくさい実装が多い。例えば、よく使われる事実として、『**`n`長の配列のrankなら`n log n` bitで実装できるよね**』というのがあるが、実は`n`以下の整数を`log n`bitで実装するのはけっこうめんどくさい。64bit整数を使いたいというのが人情だ。だって考えてみてほしい。いきなり怖い先輩がやってきて、

これ絶対\\(2^34\\)越えないから35bit整数型で実装しろよ

と言ってくることを。僕なら泣いてしまう。泣きながら64bit整数型を使い、先輩に教育されてしまう。一度真剣に考えてほしいが、どうやって38bit整数型を作ろうと思うのか。せこせこ`vector<bool>`で作っても、先輩がやってきて、

お前の作った整数型、メモリフェッチ遅いんだけど

とか言われたら慚愧の念そのものになってしまう。メモリレイアウトとは何なのか。メモリのアラインメントとは何なのか。人は、なぜ……。

さらに、rankを簡潔データ構造でやると、

1. 整数Nを決めて、Nの倍数の部分だけ陽に持ちます。
2. サンプリングしたNの間は、たかだかN個しか1がないので、ここをさらに分割してエンコードします。
3. 上で作った分割を十分小さくして、M長にすれば、全\\(2^M\\)パターンを列挙したテーブルを持っておくことでエンコードできます。

などという、ちょっと……な実装をすることになる。もちろん、こうするとメモリは小さいし、rankは定数時間で終わるしでいいことずくめなのだが、各ステップでかなりのbit力を要求される。特に、Rustは**`bool`が1byte**という状況なので[^3]、サイズ`n`の`Vec<bool>`は**8n bit**メモリを使うことになる[^4]。要するに自分で頑張れということだ。さすがに？

そういうわけで、真面目にやりたい人はどこかのライブラリを使えばいいわけだが、あまり依存関係を増やしたくない人は『そこそこ使える』ライブラリを書くことになる。


### お手軽BV

**この実装は簡潔データ構造ではない**

さて、そうはいっても、rankを全て陽に持つことはできない。そこで、突然だが64bitごとにrankを持つことにする。こうすると、使うメモリは 64bit * n /64 = n bitで、まあ効率はそんなによくないが、さっきよりはましだ。

分かっていると思うが、BitVector`V`本体を表すために`Vec<u64>`を使う。こうすると、サンプルした結果を入れた配列を`S`とおくと、`rank_1[V,i] = S[i/64] + V[i/64]の(i%64)bit分`でRankが計算できる。ヤバい簡単である。

さて、Selectも同じノリで実装する。`i`番目の1が欲しいとき、さっきのサンプリングした配列`S`を二分探索すれば`log n/64`でできるが、もうちょっと早くしたい。

ここで、ものすごい雑だが、整数`i`に対して、`100*i`番目の1の場所をサンプリングしておくことにする(`S'`)。こうしておくと、`select_1[V,i]`に対しては、まず`S'[i/100]`で場所のあたりをつけてから二分探索が出来るようになる。はやい。

もちろん、性能はかなり劣化して、`select`はナイーブに全部記録するより20倍くらい悪くなるが、全部記録するのがメモリアクセス一回だけなので、まあこれはしょうが無いだろう。


本当にマジのBitVectorを作るとかなりのコードを書く羽目になるが、この実装は100行くらいで書ける。簡単だ。

```rust
//! BitVector.
const SELECT_BUCKET: usize = 100;
#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct BitVec {
    inner: Vec<u64>,
    bucket: Vec<u64>,
    // select_true[i] = Position of the 100*i-th true.
    select_true: Vec<usize>,
    select_false: Vec<usize>,
}

impl std::convert::AsRef<[u64]> for BitVec {
    fn as_ref(&self) -> &[u64] {
        self.inner.as_ref()
    }
}

impl BitVec {
    pub fn get(&self, index: usize) -> bool {
        let block = index / 64;
        let index = index % 64;
        let probe = 0b1 << index;
        (self.inner[block] & probe != 0)
    }
    pub fn new(xs: &[bool]) -> Self {
        let mut inner = vec![0; xs.len() / 64 + 1];
        for (idx, _) in xs.iter().enumerate().filter(|x| *x.1) {
            let bucket = idx / 64;
            let index = idx % 64;
            let probe = 0b1 << index;
            inner[bucket] |= probe;
        }
        let (_, bucket) = inner.iter().map(|&x: &u64| x.count_ones() as u64).fold(
            (0, vec![]),
            |(acc, mut bc), count| {
                bc.push(acc);
                (acc + count, bc)
            },
        );
        let (mut select_true, mut select_false) = (vec![0], vec![0]);
        let (mut pos, mut neg) = (0, 0);
        for (idx, &b) in xs.iter().enumerate() {
            if b {
                pos += 1;
                if pos % SELECT_BUCKET == 0 {
                    select_true.push(idx);
                }
            } else {
                neg += 1;
                if neg % SELECT_BUCKET == 0 {
                    select_false.push(idx);
                }
            }
        }
        Self {
            inner,
            bucket,
            select_true,
            select_false,
        }
    }
    pub fn rank(&self, x: bool, i: usize) -> usize {
        if x {
            let idx = i / 64;
            let rem = i % 64;
            let mask = (0b1 << rem) - 1;
            self.bucket[idx] as usize + (self.inner[idx] & mask).count_ones() as usize
        } else {
            i - self.rank(true, i)
        }
    }
    /// Return the i-th x. Note that the i begins one.
    /// In other words, self.rank(true, 0) would
    /// return zero and self.rank(true,1) would
    /// return the position of the first true.
    pub fn select(&self, x: bool, i: usize) -> usize {
        if i == 0 {
            return 0;
        }
        let block = {
            let compare = |position| {
                let count: usize = if x {
                    self.bucket[position] as usize
                } else {
                    64 * position - self.bucket[position] as usize
                };
                count.cmp(&i)
            };
            let chunk = i / SELECT_BUCKET;
            let (mut s, mut e) = if x {
                let s = self.select_true[chunk] / 64;
                let e = if chunk + 1 < self.select_true.len() {
                    self.select_true[chunk + 1] / 64
                } else {
                    self.bucket.len() - 1
                };
                (s, e)
            } else {
                let s = self.select_false[chunk] / 64;
                let e = if chunk + 1 < self.select_false.len() {
                    self.select_false[chunk + 1] / 64
                } else {
                    self.bucket.len() - 1
                };
                (s, e)
            };
            use std::cmp::Ordering::*;
            match compare(e) {
                Less => e,
                Equal | Greater => {
                    while e - s > 1 {
                        let center = (s + e) / 2;
                        match compare(center) {
                            std::cmp::Ordering::Less => s = center,
                            _ => e = center,
                        }
                    }
                    s
                }
            }
        };
        let mut occs_so_far = if x {
            self.bucket[block] as usize
        } else {
            64 * block - self.bucket[block] as usize
        };
        let window = if x {
            self.inner[block]
        } else {
            !self.inner[block]
        };
        let mut cursor = 0;
        while occs_so_far < i && cursor < 64 {
            occs_so_far += ((window & (1 << cursor)) != 0) as usize;
            cursor += 1;
        }
        if occs_so_far == i {
            block * 64 + cursor as usize - 1
        } else {
            self.inner.len() * 64
        }
    }
}
```

[^1]: 塩基が。
[^2]: 言っておくが、ならない。
[^3]: これはLLVMがそうなっているからで、Rustが悪いわけではない。
[^4]: C++のvector<bool>は闇の力を使い`sort`を生け贄に捧げることで1bitにしてある。