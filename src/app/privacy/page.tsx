'use client'
import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="bg-gray-20 shadow-md rounded-lg py-4 sm:py-8 px-5 sm:px-10 mx-3">
      <div>
        <Link href="/signup" className="text-sm text-blue-600 hover:underline">
          ← 登録ページに戻る
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8">プライバシーポリシー<br/>（Privacy Policy）</h1>
      <p className="mt-4">最終更新日：2025年9月10日</p>
      <p className="mt-6 text-sm sm:text-base">
        TAISEN（以下「当社」といいます。）は、本ウェブサイトおよびアプリケーション（以下「本サービス」といいます。）における、
        ユーザー（以下「ユーザー」といいます。）の個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。<br/>
      </p>
       <p className="mt-3 text-sm sm:text-base">
        当社は、個人情報保護法その他の日本国内法令を遵守し、ユーザーの個人情報を適切に取り扱うよう努めます。
      </p>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第1条（個人情報の定義）</h2>
        <p className="text-sm sm:text-base mt-2">
          本ポリシーにおいて「個人情報」とは、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）第2条第1項に定める、
          氏名、メールアドレス、プロフィール画像、ID等、特定の個人を識別できる情報をいいます。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第2条（収集方法）</h2>
        <p className="text-sm sm:text-base mt-2">当社は、以下の方法で個人情報を収集します。</p>
        <ul className="list-disc list-inside text-sm sm:text-base gap-y-1 mt-2 indented-li">
          <li>ユーザーが本サービスに登録するときに入力する情報</li>
          <li>サービス利用履歴として、本サービス利用時に自動的に生成・蓄積される情報（投票履歴、対戦カード作成履歴、アクセスログ、IPアドレス、閲覧履歴等）</li>
          <li>Cookie、Webビーコン等の技術を用いて自動的に取得する情報</li>
          <li>お問い合わせフォーム等を通じてユーザーが入力・送信する情報</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第3条（取得する個人情報の項目）</h2>
        <p className="text-sm sm:text-base mt-2">当社は、以下の個人情報を取得します。</p>
        <ul className="list-disc list-inside text-sm sm:text-base gap-y-1 mt-2 indented-li">
          <li>登録情報：アカウント名、メールアドレス、プロフィール画像</li>
          <li>
            認証情報：認証トークン、パスワード<br/>
            （パスワードそのものは当社で保持せず、Supabase認証サービスにより安全に管理・保管されます。）
          </li>
          <li>活動履歴：投票履歴、対戦カード作成履歴、検索履歴</li>
          <li>ログ情報：IPアドレス、ブラウザ情報、端末情報、アクセス日時</li>
          <li>その他当社が定める入力フォームに入力された情報</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第4条（利用目的）</h2>
        <p className="text-sm sm:text-base mt-2"> 当社は取得した個人情報を、以下の目的で利用します。</p>
        <ul className="list-disc list-inside text-sm sm:text-base gap-y-1 mt-2 indented-li">
          <li>本サービスの提供・運営および機能改善</li>
          <li>ユーザー認証、アカウント管理、パスワードリセットのため</li>
          <li>投票履歴や作成履歴の保存・表示</li>
          <li>フィードバック・お問い合わせ対応</li>
          <li>サービス利用状況の分析および統計データ作成</li>
          <li>不正行為の検知・防止</li>
          <li>マーケティング活動（メールマガジン配信、広告配信等）</li>
          <li>本ポリシー変更や重要なお知らせの通知</li>
          <li>本サービスに付随するその他の業務遂行</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第5条（第三者提供の制限）</h2>
        <p className="text-sm sm:text-base mt-2">当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。</p>
        <ul className="list-disc list-inside text-sm sm:text-base gap-y-1 mt-2 indented-li">
          <li>法令に基づく場合</li>
          <li>人命・身体・財産保護のために必要で、同意取得が困難な場合</li>
          <li>公衆衛生の向上または児童の健全育成推進に特に必要な場合で、本人同意取得が困難なとき</li>
          <li>国または地方公共団体が法令に定める事務を遂行するため協力が必要な場合で、同意取得が当該事務遂行に支障を及ぼすおそれがあるとき</li>
        </ul>
        <p className="mt-3">前項にかかわらず、以下の場合は第三者提供には該当しません。</p>
        <ul className="list-disc list-inside gap-y-1 mt-2 indented-li">
          <li>当社が利用目的達成に必要な範囲で個人情報の取扱いを委託する場合</li>
          <li>事業承継（合併、分割、譲渡等）に伴い個人情報が提供される場合</li>
          <li>公的機関から法令に基づく要請があった場合</li>
          <li>特定の者との間で個人情報を共同利用する場合で、共同利用する者の範囲、利用目的、管理責任者等を事前に通知または容易に知り得る状態に置いた場合</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第6条（開示請求）</h2>
        <p className="text-sm sm:text-base mt-2">
          ユーザーは、自己の個人情報の開示を当社に請求できます。開示請求を受けた場合、法令に従い速やかに対応し、開示しない場合はその理由を通知します。
        </p>
        <ul className="list-disc list-inside gap-y-1 mt-2 indented-li">
          <li>本人または第三者の権利利益を害するおそれがある場合</li>
          <li>当社の業務遂行に著しい支障を及ぼすおそれがある場合</li>
          <li>その他法令に違反する場合</li>
        </ul>
        <p className="text-sm sm:text-base"> 
          個人情報以外の情報（利用履歴等）については、原則として開示請求の対象外とします。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第7条（訂正・削除請求）</h2>
        <p className="text-sm sm:text-base mt-2">
          ユーザーは、自己の個人情報に誤りがある場合、当社所定の方法で訂正、追加、または削除を請求できます。当社は請求内容を確認のうえ、適切に対応します。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl sm:text-xl font-semibold mt-2">第8条（利用停止等の請求）</h2>
        <p className="text-sm sm:text-base mt-2">
          ユーザーは、個人情報が利用目的を超えて取り扱われている場合や不正に取得された場合、利用停止または消去を請求できます。
          当社は必要な調査を行い、相当と認めたときは速やかに対応します。
          費用その他の理由で直ちに利用停止等が困難な場合、ユーザーの権利利益を保護するため代替措置を講じます。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第9条（Cookie等の利用）</h2>
        <p className="text-sm sm:text-base mt-2">
          当社は、以下の目的でCookieおよび類似技術を利用します。
        </p>
        <ul className="list-disc list-inside text-sm sm:text-base gap-y-1 mt-2 indented-li">
          <li>ログイン状態の維持</li>
          <li>利用状況の分析およびサービス改善</li>
          <li>不正行為の防止</li>
        </ul>
        <p className="text-sm sm:text-base mt-2">
          ユーザーはブラウザ設定でCookieの受け入れを拒否できますが、一部機能が正常に動作しない場合があります。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第10条（解析ツールの利用）</h2>
        <p className="text-sm sm:text-base mt-2">
          当社は、本サービスの改善および統計分析のため、Google Analytics等のアクセス解析ツールを利用します。解析データは匿名化され、個人を特定しません。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第11条（安全管理措置）</h2>
        <p className="text-sm sm:text-base mt-2">当社は、個人情報の漏洩、改ざん、紛失を防止するため、以下の措置を講じます。</p>
        <ul className="list-disc list-inside text-sm sm:text-base gap-y-1 mt-2 indented-li">
          <li>不正アクセス防止策（アクセス制限、通信暗号化等）</li>
          <li>適切なセキュリティ対策による個人情報の安全な保管</li>
          <li>委託先に対する適正な監督</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第12条（未成年者の個人情報保護）</h2>
        <p className="text-sm sm:text-base mt-2">
          未成年者が本サービスを利用する場合、法定代理人の同意が必要となる場合があります。
          未成年者の個人情報について訂正・削除等の請求があった場合は、法定代理人の同意を確認のうえ対応します。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第13条（本ポリシーの変更）</h2>
        <p className="text-sm sm:text-base mt-2">
          本ポリシーは、法令改正やサービス内容の変更に伴い、予告なく改定することがあります。改定後の内容は本サービス上に掲載した時点で効力を生じます。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg sm:text-xl font-semibold mt-2">第14条（お問い合わせ窓口）</h2>
        <p className="text-sm sm:text-base mt-2">本ポリシーに関するお問い合わせは、下記までお願いいたします。</p>
        <p className="text-sm sm:text-base mt-2">
          運営チーム：TAISEN運営チーム<br />
          Email：<Link href="mailto:contact@taisenn.com" className="text-blue-600 hover:underline">contact@taisenn.com</Link>
        </p>
      </section>
    </div>
  );
}