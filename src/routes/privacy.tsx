import { createFileRoute } from '@tanstack/react-router'

import { SiteFooter, SiteHeader } from '../ui/site-chrome.tsx'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

const UPDATED = '2026-08-23'

function PrivacyPage() {
  return (
    <main className="site-shell legal-page">
      <SiteHeader visitorsOnline={0} visitorsLast24h={0} />
      <article className="legal-doc">
        <p className="legal-kicker">法律条款</p>
        <h1>StarRank 隐私政策</h1>
        <p className="legal-updated">最后更新：{UPDATED}</p>

        <section>
          <h2>关于本政策</h2>
          <p>
            StarRank（"我们"）致力于保护您的隐私。本隐私政策（"政策"）说明当您使用
            StarRank 付费公开榜单服务（"服务"，<a href="https://starrank.lol">https://starrank.lol</a>）时，
            我们如何收集、使用、存储和共享您的个人信息，以及您可享有的权利。
          </p>
          <p>
            使用服务即表示您同意本政策。我们可能不定期更新本政策，
            重大变更将通过网站公告提前至少 15 天通知您。
          </p>
        </section>

        <section>
          <h2>1. 数据控制者</h2>
          <ul>
            <li>运营者：StarRank（个人开发者，个体经营）</li>
            <li>联系邮箱：support@starrank.lol</li>
            <li>数据保护官：不适用</li>
          </ul>
        </section>

        <section>
          <h2>2. 我们收集的个人信息</h2>
          <h3>2.1 您直接提供的信息</h3>
          <ul>
            <li><strong>条目信息：</strong>您出价时提交的名称、描述、图片链接与目标网址（公开显示在榜单上）；</li>
            <li><strong>支付信息：</strong>交易金额与支付状态。我们不存储完整的银行卡号——卡数据由我们的支付处理方处理（见第 5 节）；</li>
            <li><strong>沟通记录：</strong>您发送给我们的电子邮件与反馈。</li>
          </ul>
          <h3>2.2 我们自动收集的信息</h3>
          <ul>
            <li><strong>设备与网络：</strong>IP 地址、浏览器类型、操作系统；</li>
            <li><strong>国家/地区：</strong>根据请求来源的国家代码生成聚合统计（如"来自某国的访客数"），不用于识别个人；</li>
            <li><strong>使用数据：</strong>访问的页面、点击了哪些榜单条目。</li>
          </ul>
          <h3>2.3 Cookie 与本地存储</h3>
          <p>
            我们设置少量必要的 Cookie 来维持语言偏好和识别同一访客
            （例如：允许条目所有者在榜内加价、统计独立访客数）。我们不使用广告或跨站跟踪 Cookie。
          </p>
        </section>

        <section>
          <h2>3. 我们如何使用您的信息</h2>
          <table className="legal-table">
            <thead><tr><th>用途</th><th>法律依据</th></tr></thead>
            <tbody>
              <tr><td>榜单展示与服务运行</td><td>合同履行</td></tr>
              <tr><td>支付处理与结算验证</td><td>合同履行</td></tr>
              <tr><td>客户支持与退款处理</td><td>合同履行 / 合法利益</td></tr>
              <tr><td>安全与欺诈防范</td><td>合法利益</td></tr>
              <tr><td>匿名化流量统计</td><td>合法利益</td></tr>
              <tr><td>法律合规</td><td>法定义务</td></tr>
            </tbody>
          </table>
          <p>我们可能会对数据进行聚合或匿名化用于统计分析，此类数据无法关联到任何个人。</p>
        </section>

        <section>
          <h2>4. Cookies 一览</h2>
          <table className="legal-table">
            <thead><tr><th>类型</th><th>用途</th><th>可禁用</th></tr></thead>
            <tbody>
              <tr><td>严格必要</td><td>访客识别、语言偏好、核心功能</td><td>否</td></tr>
              <tr><td>分析</td><td>匿名访问统计</td><td>是</td></tr>
            </tbody>
          </table>
          <p>我们不使用营销或跨站跟踪类 Cookie。您可以通过浏览器设置管理 Cookie。</p>
        </section>

        <section>
          <h2>5. 共享与披露</h2>
          <p>我们不出售您的个人信息。仅在以下情形下共享：</p>
          <ul>
            <li>
              <strong>服务提供商：</strong>云托管（Cloudflare, Inc.——Workers 计算、D1 数据库与 CDN）
              与支付处理方 <strong>Waffo Pancake</strong>（Waffo，作为商户记录方与法定销售方）。
              支付卡数据由 PCI-DSS 认证的 Waffo Pancake 专门处理，不存储在我们的服务器上；
            </li>
            <li><strong>法律要求：</strong>依法律、法院命令或合法监管请求所必需时；</li>
            <li><strong>征得您的同意：</strong>任何其他目的均需事先获得您的明确同意。</li>
          </ul>
        </section>

        <section>
          <h2>6. 数据安全</h2>
          <ul>
            <li>传输加密：全程 TLS / HTTPS；</li>
            <li>敏感数据（Cookie 签名密钥、API 私钥）以密文形式保存在平台密钥库中；</li>
            <li>最小权限原则管理访问。</li>
          </ul>
          <p>
            如发生影响您权利的安全事件，我们将依法在发现后 72 小时内通知您和相关监管机构。
          </p>
        </section>

        <section>
          <h2>7. 数据保留</h2>
          <table className="legal-table">
            <thead><tr><th>数据类型</th><th>保留期限</th><th>到期后</th></tr></thead>
            <tbody>
              <tr><td>榜单条目内容</td><td>条目在榜期间</td><td>删除或匿名化</td></tr>
              <tr><td>交易记录</td><td>依法保存（通常 5 年）</td><td>删除或归档</td></tr>
              <tr><td>支持邮件往来</td><td>争议解决后 2 年</td><td>安全删除</td></tr>
              <tr><td>匿名流量记录</td><td>最长 12 个月</td><td>自动过期</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>8. 您的数据权利</h2>
          <p>联系我们（support@starrank.lol）即可行使以下权利，我们在 30 个日历日内回复：</p>
          <table className="legal-table">
            <thead><tr><th>权利</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td>知情权</td><td>了解我们收集哪些数据及如何使用</td></tr>
              <tr><td>访问权</td><td>获取您的个人信息副本</td></tr>
              <tr><td>更正权</td><td>更正不准确或不完整的数据</td></tr>
              <tr><td>删除权</td><td>在特定条件下要求删除</td></tr>
              <tr><td>限制处理权</td><td>特定情形下暂时限制处理</td></tr>
              <tr><td>可携带权</td><td>以机器可读格式接收您的数据</td></tr>
              <tr><td>反对权</td><td>基于合法利益或营销的处理可被反对</td></tr>
              <tr><td>撤回同意权</td><td>撤回基于同意的处理授权</td></tr>
            </tbody>
          </table>
          <p>您也有权向您所在地的数据保护机构投诉。</p>
        </section>

        <section>
          <h2>9. 国际数据传输</h2>
          <p>
            我们的服务托管于 Cloudflare 全球边缘网络，支付处理方 Waffo 的基础设施可能位于新加坡、美国等地。
            跨境传输时，我们通过纳入欧盟标准合同条款（SCCs）的数据处理协议等保障措施保护您的数据。
          </p>
        </section>

        <section>
          <h2>10. 儿童隐私</h2>
          <p>
            服务面向 18 周岁及以上的用户（出价与付款行为要求成年）。我们不会有意收集不满该年龄儿童的信息。
            如您认为有儿童向我们提供了信息，请立即联系我们，我们会及时删除。
          </p>
        </section>

        <section>
          <h2>11. 第三方链接与服务</h2>
          <p>
            榜单上的条目会链接到第三方网站。本政策仅适用于我们直接收集的数据。
            我们对第三方的隐私做法不承担责任，建议您在使用前查阅其隐私政策。
          </p>
        </section>

        <section>
          <h2>12. 政策变更</h2>
          <p>
            重大变更时，我们将提前至少 15 天通过网站公告通知您，并更新页面顶部的"最后更新"日期。
            生效日期后继续使用即构成接受。
          </p>
        </section>

        <section>
          <h2>13. 联系我们</h2>
          <ul>
            <li>隐私与支持邮箱：support@starrank.lol</li>
            <li>运营者：StarRank</li>
            <li>网站：<a href="https://starrank.lol">https://starrank.lol</a></li>
          </ul>
        </section>

        <p className="legal-footer-note">
          本隐私政策仅供一般参考，不构成法律意见。<br />
          最后更新：{UPDATED} · StarRank · https://starrank.lol
        </p>
      </article>
      <SiteFooter />
    </main>
  )
}
