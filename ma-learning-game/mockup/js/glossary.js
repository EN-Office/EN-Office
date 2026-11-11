'use strict';
/* ---------- 用語集（「？」ボタン＋用語モーダル） ---------- */
const GL={
 'M&A':['M&A','Mergers and Acquisitions','会社どうしの合併や、会社・事業の買収のこと。お金を払って会社の株式や事業を手に入れ、経営する権利を移す取引です。','このゲームのテーマそのもの。企業獣を迎え入れることがM&Aにあたります。'],
 'ソーシング':['ソーシング','Sourcing','買収する相手の候補を探すこと。自社の戦略（何を手に入れたいか）に合う会社を見つけるところからM&Aは始まります。','「探索」ステップ。戦略に合う企業獣を選びます。'],
 '鑑定':['鑑定（バリュエーション）','Valuation','会社の価値をお金に換算すること。純資産法・類似会社比較法・DCF法など、いくつかの方法で価格の目安を出します。','「鑑定レンズ」で価値のレンジを出すステップです。'],
 '統合':['統合（PMI）','Post Merger Integration','買収した後に、2つの会社の仕組み・文化・人をひとつにまとめていくこと。M&Aの成否はここで決まると言われます。','「統合」ステップ。100日プランで施策を選びます。'],
 'デューデリジェンス':['デューデリジェンス（DD）','Due Diligence','買収の前に、相手の会社を詳しく調べること。財務・法務・税務・人事などの専門家が、隠れたリスクや本当の価値を確認します。','調査ボードで、限られた調査チームをどこに割り振るかを決めます。'],
 'DD':['DD（デューデリジェンス）','Due Diligence','買収の前に、相手の会社を詳しく調べること。財務・法務・税務・人事などの専門家が、隠れたリスクや本当の価値を確認します。','調べなかった場所のリスクは「？」のまま見えません。'],
 '財務DD':['財務DD','Financial DD','決算書や資産・負債を調べ、利益が本当か、帳簿に載っていない借金がないかなどを確認する調査。','見つかったお金のリスクは「価格調整」で価格に反映できます。'],
 '法務DD':['法務DD','Legal DD','契約書、訴訟、許認可などを調べる調査。買収で取引先との契約が切れないかなども確認します。','契約上のリスクは「クロージング条件」などで備えます。'],
 '人事DD':['人事DD','HR DD','従業員、給与、労務問題、組織などを調べる調査。キーマン（欠かせない人）が残るかも重要な確認点です。','キーマンのリスクは「キーマン条項」や統合施策で備えます。'],
 '税務DD':['税務DD','Tax DD','過去の税金の申告に問題がないか、買収後に思わぬ税金がかからないかを調べる調査。',''],
 '簿外債務':['簿外債務','Off-balance-sheet Liabilities','決算書（貸借対照表）に載っていない借金や支払い義務。未払いの残業代や保証の肩代わりなどがあり、DDで見つけることが大切です。','見つけると、その分だけ買収価格を下げられます。'],
 '未払い残業代':['未払い残業代','Unpaid Overtime','本来払うべきなのに払われていない残業代。買収後に請求されると、買い手の負担になる「簿外債務」の代表例です。','財務DDで発見し、価格調整で手当てします。'],
 '訴訟リスク':['訴訟リスク','Litigation Risk','裁判を起こされている、または起こされそうな問題。負けると賠償金などで会社の価値が下がります。',''],
 'キーマン依存':['キーマン依存','Key Person Dependency','会社の技術や取引が特定の人に頼りきっている状態。その人が辞めると、会社の価値が大きく下がるおそれがあります。',''],
 'キーマン条項':['キーマン条項','Key Person Clause','大事な人物が買収後も一定期間会社に残ることを、契約の条件や約束として定めるもの。ゲームでは簡略化した呼び方です。','工場長が残れば、技術が引き継がれます。'],
 '純資産法':['純資産法','Net Asset Method','会社の資産から負債を引いた「純資産」をもとに価値を出す方法。わかりやすい反面、将来の稼ぐ力は反映されにくい。','鑑定レンズ①。序章〜1章で使います。'],
 '純資産':['純資産','Net Assets','資産から負債を引いた残り。会社の「正味の持ち物」です。',''],
 '資産':['資産','Assets','会社が持っている財産。現金、在庫、工場、土地など。',''],
 '負債':['負債','Liabilities','会社がいずれ返す・払う必要があるもの。借入金や未払金など。','企業獣の「重り」として表現されます。'],
 '時価':['時価','Fair Value','いま売ったらいくらになるか、という現在の値段。帳簿の値段（簿価）とずれていることがあります。',''],
 '含み益':['含み益','Unrealized Gain','買ったときより今の値段が上がっていて、まだ売っていない利益。古くから持っている土地などで生まれやすい。',''],
 '将来の稼ぐ力':['将来の稼ぐ力（収益力）','Earning Power','会社がこれから利益を生み出す力。技術・ブランド・顧客などは決算書の資産に載りにくく、純資産法だけでは価値に表れません。','鑑定では、時価純資産にこの分を上乗せして価格の幅を考えます。'],
 'のれん':['のれん','Goodwill','買収価格が、買収した会社の純資産の時価（資産と負債を時価で評価した差額）を上回る部分。将来の稼ぐ力やシナジーへの期待が背景にあり、買い手の連結決算で資産として計上されます（企業結合に関する会計基準）。','日本の会計基準では20年以内で償却し、価値が下がれば「減損」として損失になります。高く払いすぎに注意。'],
 '適正レンジ':['適正レンジ','Valuation Range','鑑定の結果から出した「このくらいが妥当」という価格の幅。M&Aの価格はひとつの正解ではなく幅で考えます。',''],
 '基本合意書':['基本合意書（MOU）','Memorandum of Understanding','本格的な調査（DD）の前に、価格の目安やスケジュール、独占して交渉する権利などを確認しあう書面。','合意すると、DDに進めます。'],
 'MOU':['MOU（基本合意書）','Memorandum of Understanding','本格的な調査（DD）の前に、価格の目安やスケジュール、独占して交渉する権利などを確認しあう書面。',''],
 '株式譲渡契約':['株式譲渡契約（SPA）','Share Purchase Agreement','株式を売り買いする最終的な契約。価格、支払い方法、表明保証、条件などを細かく定めます。','条項カードをはめて完成させます。'],
 'SPA':['SPA（株式譲渡契約）','Share Purchase Agreement','株式を売り買いする最終的な契約。価格、支払い方法、表明保証、条件などを細かく定めます。',''],
 '表明保証':['表明保証','Representations and Warranties','売り手が「会社についてのこの説明は正しい」と契約で約束すること。後で違っていたら、補償を求める根拠になります。','見逃したリスクへの保険のような役割です。'],
 '補償':['補償','Indemnification','表明保証が事実と違っていたときなどに、売り手が買い手の損を埋め合わせること。',''],
 '価格調整':['価格調整','Price Adjustment','DDで見つかった問題や、契約から実行までの変化に応じて買収価格を見直す仕組み。','見つけたお金のリスクを価格から差し引けます。'],
 'クロージング条件':['クロージング条件','Conditions Precedent','買収を実行する前に満たしておくべき条件。たとえば「主要取引先から契約継続の同意をもらうこと」など。',''],
 'クロージング':['クロージング','Closing','契約にもとづいて代金を払い、株式を受け取って、買収を実際に完了させること。',''],
 '経営者が変わったら解約できる':['チェンジ・オブ・コントロール条項','Change of Control Clause','会社の持ち主（支配権）が変わったら、相手が契約を解除できるという取り決め。M&Aで取引先を失う原因になります。','法務DDで見つけ、クロージング条件で備えます。'],
 '100日プラン':['100日プラン','100-Day Plan','買収後およそ100日の間に行う統合の計画。最初の数か月の動き方が、従業員の信頼やシナジーを大きく左右します。',''],
 'シナジー':['シナジー','Synergy','ふたつの会社が一緒になることで、別々のときの合計以上の価値が生まれる効果。売上が伸びる「売上シナジー」とコストが下がる「コストシナジー」があります。','相性の良い会社を隣に置くと大きくなります。'],
 'グループ企業価値':['グループ企業価値','Group Value','あなたのグループ全体の価値を表すゲーム内スコア。現実の企業価値の考え方を簡略化しています。','街の規模や景観に反映されます。'],
 '企業価値':['企業価値','Enterprise Value','会社の事業が生み出す価値全体。株主のもの（株式価値）と、お金を貸している人のもの（純有利子負債）を合わせた価値です。',''],
 '後継者':['事業承継','Business Succession','経営者が会社を次の世代に引き継ぐこと。後継者がいない会社が、M&Aで別の会社に引き継がれるケースが増えています。','序章・1章のテーマです。'],
 '後継ぎ':['事業承継','Business Succession','経営者が会社を次の世代に引き継ぐこと。後継者がいない会社が、M&Aで別の会社に引き継がれるケースが増えています。',''],
 'アドバイザー':['アドバイザー（FA）','Financial Advisor','M&Aで買い手か売り手の一方につき、相手探し・価値の算定・交渉などを手伝う専門家。','ミナトはあなた専属のアドバイザーです。'],
 'ディールメーカー':['ディールメーカー','Deal Maker','M&Aなどの取引（ディール）をまとめる人。','あなたのことです。'],
 'アナリスト':['アナリスト','Analyst','投資銀行などでの若手の役職名。資料作成や分析を担当します。','ゲーム内ランクの最初の段階です。'],
 'アソシエイト':['アソシエイト','Associate','アナリストの一つ上の役職。案件の実務をまとめる立場です。','ゲーム内ランクの2段階目です。'],
 'TOB':['TOB（株式公開買付け）','Takeover Bid','上場会社の株を、期間・価格・数を公表して市場の外で多くの株主から買い集める方法。金融商品取引法でルールが決められています。','後半の章や追加ケースで登場予定です。'],
 '企業獣':['企業獣（カンパニー・ビースト）','Company Beast','このゲームの世界で、会社を生き物として表した存在。業種で姿が変わり、売上や利益がステータスになります。','いつでも本当の数字（財務）に切り替えて見られる設計です。'],
 '探索':['探索（ソーシング）','Sourcing','買収する相手の候補を探すこと。自社の戦略（何を手に入れたいか）に合う会社を見つけるところからM&Aは始まります。','戦略に合う企業獣を選ぶステップです。'],
 'FA':['FA（フィナンシャル・アドバイザー）','Financial Advisor','M&Aで買い手か売り手の一方につき、相手探し・価値の算定・交渉などを手伝う専門家。',''],
 '在庫の水増し':['在庫の水増し','Inflated Inventory','実際より在庫を多く見せかけること。利益や資産が実態より大きく見えるため、買い手は高く払いすぎるおそれがあります。',''],
 '売掛金の焦げつき':['売掛金の焦げつき','Bad Receivables','売ったのに代金を回収できない状態。帳簿上は資産でも、実際には価値がないことがあります。',''],
 '保証債務':['保証債務','Guarantee Obligations','他人の借金の保証人になっていることによる支払い義務。相手が返せないと、代わりに払う必要があります。簿外債務になりやすい代表例です。',''],
 '追徴課税':['追徴課税','Additional Tax Assessment','税務調査などで申告の誤りを指摘され、あとから追加で納める税金。買収後に発生すると買い手の負担になります。',''],
 '設備の老朽化':['設備の老朽化','Aging Equipment','機械や建物が古くなり、近いうちに大きな更新投資が必要になる状態。将来のお金の出ていきとして価格に影響します。',''],
 'なつき度':['なつき度','Employee Engagement','従業員が会社にどれだけ前向きに関わっているかを表すゲーム内の指標。現実の「従業員エンゲージメント」にあたります。','下がると人材が流出します。']
};
/* 「？」とモーダルを出すのは専門用語だけ（ui-guidelines 3.3）。他の項目はデータとして残すが自動では印をつけない */
const GL_MARK=['デューデリジェンス','DD','純資産法','含み益','基本合意書','MOU','株式譲渡契約','SPA','表明保証','価格調整','クロージング条件','キーマン条項','簿外債務','100日プラン','シナジー','のれん','TOB'].filter(k=>GL[k]);
const GL_RE=new RegExp(GL_MARK.slice().sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
const GL_ALIAS={'DD':'デューデリジェンス','デューデリジェンス':'DD','MOU':'基本合意書','基本合意書':'MOU','SPA':'株式譲渡契約','株式譲渡契約':'SPA'};
let glSeen=new Set();
function sfx(name){try{SFX.play(name)}catch(e){}}
function markTerms(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    const p=n.parentElement;if(!p||p.closest('button,a,input,label,svg,.term,.q,.modal,.logo,.rank,script,style,.mono,.price,.ticks,.disp,.stepname,.ttl,.chip,.label,.big'))return NodeFilter.FILTER_REJECT;
    GL_RE.lastIndex=0;return GL_RE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(n=>{
    const txt=n.nodeValue;let last=0,m,frag=document.createDocumentFragment(),changed=false;GL_RE.lastIndex=0;
    while((m=GL_RE.exec(txt))){
      const key=m[0];
      /* 英字の略語は単語の一部（例：DDスキャン、財務DD）には印をつけない */
      if(/^[A-Z]+$/.test(key)){const b=txt[m.index-1]||'',a=txt[m.index+key.length]||'';if(/[A-Za-z0-9ァ-ヶー一-鿿]/.test(b)||/[A-Za-z0-9ァ-ヶー]/.test(a))continue}
      if(glSeen.has(key))continue;glSeen.add(key);if(GL_ALIAS[key])glSeen.add(GL_ALIAS[key]);changed=true;
      frag.appendChild(document.createTextNode(txt.slice(last,m.index)));
      const sp=document.createElement('span');sp.className='term';sp.textContent=key;
      const q=document.createElement('button');q.type='button';q.className='q';q.dataset.term=key;q.dataset.sfx='none';q.setAttribute('aria-label',key+'の説明');q.textContent='？';
      sp.appendChild(q);frag.appendChild(sp);last=m.index+key.length;
    }
    if(!changed)return;frag.appendChild(document.createTextNode(txt.slice(last)));n.parentNode.replaceChild(frag,n);
  });
}
function closeTerm(m){
  if(!m||!m.isConnected)return;sfx('close');m.remove();
  if(m._from&&m._from.isConnected)try{m._from.focus({preventScroll:true})}catch(e){}
}
function openTerm(key,from){
  const g=GL[key];if(!g)return;
  const m=document.createElement('div');m.className='modal term-modal';m._from=from||null;
  m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-label="'+g[0]+'"><div class="hd"><div class="face">'+minato()+'</div><div class="grow"><span class="chip ember kind">用語カード</span><p class="tn" style="margin-top:.3em">'+g[0]+'</p><p class="en">'+g[1]+'</p></div></div>'+
    '<p class="ex">'+g[2]+'</p>'+(g[3]?'<p class="gm"><b>ゲームでは</b>　'+g[3]+'</p>':'')+'<button class="btn" data-close data-sfx="none">わかった</button></div>';
  $stage.appendChild(m);sfx('open');m.querySelector('[data-close]').focus({preventScroll:true});
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]')){e.stopPropagation();closeTerm(m)}});
}
$stage.addEventListener('click',e=>{
  const q=e.target.closest&&e.target.closest('.q');
  if(q&&!q.closest('.modal')){e.stopPropagation();e.preventDefault();openTerm(q.dataset.term,q)}
},true);
$stage.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const t=$stage.querySelector('.term-modal');if(t){e.stopPropagation();closeTerm(t);return}
  const m=$stage.querySelector('.modal');if(m)m.remove();
},true);
new MutationObserver(ms=>{ms.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1&&!n.closest('.modal')&&!n.classList.contains('term'))markTerms(n)}))}).observe($stage,{childList:true,subtree:true});
