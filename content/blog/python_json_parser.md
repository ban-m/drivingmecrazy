+++
title = "JSON parse はクラスのインスタンスを返せ"
date = 2020-06-17
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





## まえがき

本来はVirtue signalingの続きか、Suffix Array-BiDirectional BWTの続きを書くはずだった。しかし、現在の政治的な情勢を考えるに、Virtue Signalingの続きをやるのはあまりにも危険だ（このブログは私個人と1-hop程度でつながっている。また、Bidirectional BWTは色々な遅滞によって進んでいない。





<!-- more -->

## これは何？



PythonでJSONオブジェクトをシリアライズ・デシリアライズする方法。特に、複雑なクラスを上手くSerialize/Deserializeする方法について述べる。



### モチベーション

私は基本的にRustでコードを買いている。色々な理由があるのでここでは述べない。研究室のほかのメンバーの中にはPythonを書く人がおり、コードを協調させる上ではRustとPythonのプログラムで相互にやりとりできるデータフォーマットが必要だった。



最初にあげられたのは[RON](https://github.com/ron-rs/ron)と[Pickle](https://docs.python.org/3/library/pickle.html)だったが、これらはそれぞれあまりにもRustとPythonに強く影響を受けているため、採用は見送られた。TSV、CSVも検討されたが、ヘテロなデータ（複数種類のクラスインスタンスが直列化されているデータ）が上手く扱えないため、これも除外となった。



結果として、`less`で読める、ヘテロなデータをとりあえずパックできる、RustでもPythonでも読める、というところで、[JSON](https://www.json.org/json-en.html)が採用された。Rustには[Serde_json](https://github.com/serde-rs/json)があり、Pythonには標準ライブラリに[json](https://docs.python.org/3/library/json.html)モジュールが存在するため、読み書きの上では問題がないように思われた。



Rustは、ほとんどの場合、コンパイル時に強い型をつける。直列化されたデータのデコードも例外ではなく、UTF-8エンコードされたJSONファイルは適切に指定された型にデコードされる（`Result<T,E>`の形で返却される）。また、[Serde](https://github.com/serde-rs/serde)と呼ばれるシリアライズ・デシリアライズのフレームワークがあり、`#derive`マクロによって自動的に、`serde::Serialize, serde::Deserialize`が実装されているフォーマットへ/から、直列化・非直列化できるようにしてくれる。

従って、Rustにおいて直列化・非直列化に困ることは特にない。もちろん、あるにはあって、EnumがJSONだとオブジェクトへと変換されるため、やたらディスク容量を食い、`less`で見にくいことこの上ない。例えば、監視ログが

```rust
enum WatchLog{
    Ok,
    PaketLoss,
    Stall
}
```

の形にエンコードされてひたすら流れるとき、頭文字をとって、`"OPPOOOOOOOOOOOOOSOOOOOSOOOOO"` などとエンコードしたいが、`serde`はもちろんこういうユースケースには対応せず、自分で頑張ることになる。とはいえ、これはかなりマイナーな問題だ。



一方で、Pythonの`json`モジュールはかなり鬼で、デフォルトの挙動は、

- 直列化：標準でサポートされている型のうち、直列化できるものを直列化する。できないとエラーをはく。
- 非直列化：問答無用で`Dict`オブジェクトを返してきて終了。

となっている。鬼だ。



個人的には、Rustの`serde`と同じ使用感にしたい。つまり、

- 直列化：`json.dump(fp, x, cls=TargetType)`とすると、`x`が`TargetType`へ変換されて`fp`へと書き込まれる
- 非直列化：`json.load(fp, object_hook=as_target_type)`とすると、`fp`が読み込まれて、クラス`TargeType`の型として返却される。

のような挙動をしてほしい。



もちろん、[公式ドキュメント](https://docs.python.org/3/library/json.html)を読めば終了なのだが、色々ハマりポイントがあるのでここで述べておく。



### 実例



例として、次のようなクラスを考える。



```python
import json

class Test:
    """
    Attributes
    --------
    nodes: list of Node
    some_value: str
    """
    def __init__(self, nodes=None, some_value=None):
        self.nodes = nodes
        self.some_value = some_value

class Node:
    """
    Attributes
    -----------
    inner: str,  
    edges: list of Edge
    """
    def __init__(self, inner=None, edges=None):
        self.inner=inner
        self.edges=edges

class Edge:
    """
    Attributes
    -----------------
    to: int,
    some_value: int
    """
    def __init__(self, to=None, some_value=None):
        self.to = to
        self.some_value = some_value
```



極めて簡単だが、クラスがネストされた形になっているというところは大体本質を捉えている。これを直で`json.dumps()`すると一瞬で終わることが分かるだろう。

```python
>>> import json
>>> t = Test()
>>> json.dump(t) # !!!!
```



参考までに、Rust版を書くと、



```rust
use serde::{Deserialize, Serialize};
#[derive(Serialize, Deserialize)]
pub struct Test {
    nodes: Vec<Node>,
    some_value: String,
}

#[derive(Serialize, Deserialize)]
struct Node {
    inner: String,
    edges: Vec<Edge>,
}

#[derive(Serialize, Deserialize)]
struct Edge {
    to: usize,
    some_value: u64,
}
```

とでもなり、

```rust
pub fn mockvalue() -> Test {
    let nodes = mocknodes();
    let some_value = "This Is A Test.".to_string();
    Test { nodes, some_value }
}

fn mocknodes() -> Vec<Node> {
    vec![mocknode1(), mocknode2()]
}
fn mocknode1() -> Node {
    let inner = "An inner label 1".to_string();
    let edges = mockedges1();
    Node { inner, edges }
}

fn mocknode2() -> Node {
    let inner = "An inner label 2".to_string();
    let edges = mockedges2();
    Node { inner, edges }
}

fn mockedges1() -> Vec<Edge> {
    (0..3)
        .map(|e| Edge {
            to: e,
            some_value: e as u64 * 3,
        })
        .collect()
}

fn mockedges2() -> Vec<Edge> {
    (0..2)
        .map(|e| Edge {
            to: e,
            some_value: e as u64 * 5,
        })
        .collect()
}

fn main() {
    let mock = mockvalue();
    let stdout = std::io::stdout();
    let mut stdout = std::io::BufWriter::new(stdout.lock());
    serde_json::ser::to_writer_pretty(&mut stdout, &mock).unwrap();
}
```



とでも書けば、標準出力にモックデータが出てくる。これをPythonでキャッチして、`json.load()`すると、単なる辞書が返ってくる。これを手でいちいちユーザにパースさせるのは設計が微妙だし、`Test.from(dct)`を定義して、いちいち変換させるのも無駄だ。



公式ドキュメントにも方法は書いてあるのだが、複雑なケースになるといまいち対応がしにくい。要するに、`as_test`的な関数`f`を定義して、`object_hook`の引数に指定すれば、オブジェクト（辞書）を作ったときにこの関数に渡されて、`f`を適用した結果が返って来るというわけだ。



しかし、気をつけて欲しいのが、この`object_hook=f`で指定した関数は、`json.load`がパースしたオブジェクトに対してとにかく全部噛ませられるということだ。`JSON`は入れ子の構造を許すフォーマットになっているため、『辞書をValueにもつ辞書』などがある。『辞書を要素に持つArray』もある。前者の場合は、**Valueが全てパーズされ**`f`**が噛まされた後に、親要素がパーズされ**`f`**が適用される**。後者の婆は、要素全てに`f`が噛まされて、直ちに配列になる。この`f`は`object_hook`に一つしか渡せないので、`f`は上のどの型（`Test, Node, Edge`）全てに対応する必要がある。



これを考えると、次のような関数を定義することになる：

```python
def as_test(dct):
    if 'nodes' in dct and 'some_value' in dct:
        nodes = dct['nodes']
        some_value = dct['some_value']
        return Test(nodes, some_value)
    elif 'inner' in dct and 'edges' in dct:
        inner = dct['inner']
        edges = dct['edges']
        return Node(inner, edges)
    elif 'to' in dct and 'some_value' in dct:
        to = dct['to']
        some_value = dct['some_value']
        return Edge(to, some_value)
    else:
        return dct
```



かなり限界感があるが仕方がない。もっと早くしたかったらCFFIを使うべきだ。また、`Enum`はサポートされないので、単に辞書として持つことになる。





デシリアライズの時も、公式ドキュメントに寄れば`json.JSONEncoder`を継承したクラスを作って、`default`メソッドを定義すればいい、と書いてある。このメソッドはオブジェクトをもらって、オブジェクトを返すようになっていればよい。



確かにそうなのだが、これにもいくつか注意がある。

1. この関数トップダウンで呼ばれる。つまり、これはパーザーと逆に、最初に一番上の階層で呼ばれることになる。
2. この関数はシリアライズ可能なオブジェクトを返す必要がある。
3. 継承したクラスの`default`は継承元のメソッドでは直列化できなかった時に呼ばれる。
4. シリアライザはサイクルの検出を行う；`default`メソッドがもらったオブジェクトをそのまま返す場合、そのオブジェクトは（定義から、継承元の`default`メソッドでは直列化できないが）再び継承元の`default`に渡される。こうすると、当然、また`default`メソッドが呼ばれることになり、無限ループをなす。このループ検出を行い、もしサイクルがある場合、単に直列化せずにエラーを上げる。



これらの事を気をつけると、要するに`Test`オブジェクトを直列化するときは、要素を全て直列化できる状態にしてから、自分を直列化できるようにする必要がある。もっと簡単に言うと、こうだ：

```python
class TestEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Test):
            nodes = list(map(self.default, obj.nodes))
            return {'nodes':nodes, 'some_value':obj.some_value}
        elif isinstance(obj, Node):
            edges = list(map(self.default, obj.edges))
            return {'inner':obj.inner, 'edges':edges}
        elif isinstance(obj, Edge):
            return {'to':obj.to,'some_value':obj.some_value};
        else:
            return json.JSONEncoder.default(obj)
```



これで、当初の目的が達せられた。つまり、



```python
import json
with open(file,'r') as f:
    data = json.load(f, object_hook = as_test) # Serialize
    ser_data = json.dumps(data, cls = TestEncoder)　# Deserialize
```



みたいな感じでできるようになった。おめでとうございます。