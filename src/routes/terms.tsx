import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'

import { SiteFooter, SiteHeader } from '../ui/site-chrome.tsx'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

const UPDATED = '2026-08-23'

function TermsPage() {
  return (
    <main className="site-shell legal-page">
      <SiteHeader visitorsOnline={0} visitorsLast24h={0} />
      <article className="legal-doc">
        <p className="legal-kicker">法律条款</p>
        <h1>StarRank 服务条款</h1>
        <p className="legal-updated">最后更新：{UPDATED}</p>

        <section>
          <h2>1. 引言与条款接受</h2>
          <p>
            欢迎使用 StarRank（"StarRank" / "我们"）。StarRank 由个人开发者以个体经营者身份运营。
            本服务条款（"条款")约束您访问和使用我们的付费公开榜单服务（"服务"），服务网址为{' '}
            <a href="https://starrank.lol">https://starrank.lol</a>。
          </p>
          <p>
            通过提交出价、付款或以其他方式使用服务，您确认：(a) 您已年满 18 周岁；(b) 您已阅读、理解并同意受本条款约束；
            (c) 您同意我们的《隐私政策》（<Link to="/privacy">/privacy</Link>）；
            (d) 您有权代表您本人或所代表的组织订立本协议。
          </p>
          <p><strong>重要提示：</strong>如您不同意本条款，请勿使用服务。条款更新后继续使用即视为接受修订后的条款。</p>
        </section>

        <section>
          <h2>2. 服务描述</h2>
          <h3>2.1 我们提供什么</h3>
          <p>
            StarRank 是一个付费公开排行榜：出价人为某个网址或社交账号支付费用，
            按其累计已验证出价金额在榜单上排名，金额最高者排名第一。服务通过互联网交付。
          </p>
          <h3>2.2 服务性质</h3>
          <p>
            服务是数字化、无形的产品。付款经确认后立即生效并在榜单上展示。
            由于即时数字交付的特性，退款适用第 7 节的特别限制。
          </p>
          <h3>2.3 排名机制</h3>
          <p>
            排名按每条条目的累计已验证出价金额从高到低排列；同价时后结算者靠前。
            金额不随时间衰减，条目不会因时间推移掉榜。低于第一名的出价仍会上榜，
            排在该金额能买到的位置。新位置最低 ¥10 起，步进 ¥1。退款会按退还比例降低条目的累计金额。
          </p>
        </section>

        <section>
          <h2>3. 出价资格与所有权</h2>
          <h3>3.1 出价人</h3>
          <p>
            提交出价无需注册账号：我们会通过加密 Cookie 识别同一访客。
            只有最先为某条目付款的访客，才能在该条目在榜期间为其加价。
          </p>
          <h3>3.2 条目内容</h3>
          <p>
            您为条目提交的名称、描述与图片必须是您有权使用的。
            您不得提交冒充他人、侵犯第三方知识产权或违反法律的条目。
          </p>
        </section>

        <section>
          <h2>4. 计费与支付</h2>
          <h3>4.1 单次购买授权</h3>
          <p>
            每笔出价均为一次性交易。完成支付即表示您授权 StarRank 按结账页显示的金额向您收取费用。
            服务不提供自动续费或订阅扣款。
          </p>
          <h3>4.2 支付处理方</h3>
          <p>
            支付由我们的商户记录方与支付处理方 <strong>Waffo Pancake</strong>（Waffo）处理。
            您的银行卡数据由 Waffo Pancake 按照 PCI-DSS 标准处理，不会存储在我们的服务器上。
          </p>
          <h3>4.3 税费</h3>
          <p>
            如适用法律要求，结账时显示的价格可能包含 Waffo Pancake 作为法定销售方代收代缴的税费。
          </p>
        </section>

        <section>
          <h2>5. 结算与退款政策</h2>
          <h3>5.1 结算</h3>
          <p>
            只有经验证成功的支付回调才会改变榜单排名。从收银台返回本站并不等于条目已发布；
            未完成的支付不会产生任何扣款。
          </p>
          <h3>5.2 可退款情形</h3>
          <ul>
            <li><strong>重复扣款：</strong>任何因计费错误导致的重复扣款，全额退款。</li>
            <li><strong>未交付：</strong>支付成功但条目因我们的原因未能上榜的，全额退款。</li>
            <li><strong>法定权利：</strong>如适用法律（例如欧盟/英国 14 天撤回权）赋予您退款或撤回权，该等权利予以保留。</li>
          </ul>
          <h3>5.3 一般不予退款</h3>
          <ul>
            <li>条目已按约定正常上榜并展示——出价属于即时数字交付，原则上不予退款。</li>
            <li>因违反本条款或可接受使用政策而被移除的条目。</li>
          </ul>
          <h3>5.4 如何申请退款</h3>
          <p>
            请发送邮件至 yyymalicious@gmail.com 并附上您的付款邮箱、交易单号与理由。
            我们会在 2 个工作日内确认，符合条件的退款将在 5–10 个工作日内原路退回。
          </p>
        </section>

        <section>
          <h2>6. 计费争议</h2>
          <p>
            如您认为某笔收费有误，请先联系 yyymalicious@gmail.com 再向银行发起争议。
            我们承诺在 2 个工作日内回复，并在核实后的 5 个工作日内解决计费错误。
          </p>
        </section>

        <section>
          <h2>7. 可接受使用政策</h2>
          <h3>7.1 禁止用途</h3>
          <p>您同意不利用服务从事以下行为：</p>
          <ul>
            <li>提交违法、诽谤、骚扰性或欺诈性的条目或内容；</li>
            <li>提交冒充真实个人、机构或品牌的条目，或未经授权使用他人的商标、肖像；</li>
            <li>提交包含色情、赌博、毒品或其他违规商品与服务链接的条目；</li>
            <li>侵犯任何第三方的知识产权或隐私权；</li>
            <li>规避或干扰服务的安全机制（包括但不限于自动化刷价、伪造支付回调）；</li>
            <li>违反任何适用的法律法规或卡组织规则。</li>
          </ul>
          <p>违反上述规定的条目可能被下架且不予退款，情节严重的我们将保留追究责任的权利。</p>
        </section>

        <section>
          <h2>8. 数据、隐私与安全</h2>
          <p>
            您对服务的使用受我们《隐私政策》（<Link to="/privacy">https://starrank.lol/privacy</Link>）约束。
            支付卡数据仅由 PCI-DSS 认证的支付处理方 Waffo Pancake 处理，不存储于我们的服务器。
          </p>
        </section>

        <section>
          <h2>9. 免责声明与责任限制</h2>
          <h3>9.1 免责声明</h3>
          <p>
            服务按"现状"和"现有"基础提供，不附带任何明示或默示的保证，包括对适销性、特定用途适用性或不间断可用性的保证。
          </p>
          <h3>9.2 责任限制</h3>
          <p>
            在法律允许的最大范围内，StarRank 不对任何间接、附带、后果性或惩罚性损害承担责任。
            我们的总责任不超过紧接索赔事件发生前 12 个月内您向我们支付的金额。
          </p>
        </section>

        <section>
          <h2>10. 条款终止</h2>
          <p>
            本条款在您使用服务期间持续有效。若您严重违反本条款、我们合理怀疑存在欺诈行为，
            或法律有此要求，我们可以暂停或终止您对服务的使用。
          </p>
        </section>

        <section>
          <h2>11. 适用法律与争议解决</h2>
          <p>
            本条款受新加坡法律管辖。在启动任何正式程序之前，请您先通过
            yyymalicious@gmail.com 与我们联系，尝试友好解决争议。
          </p>
        </section>

        <section>
          <h2>12. 一般规定</h2>
          <p>
            我们可能随时更新本条款。重大变更将提前至少 14 天在网站上公告。
            变更生效后继续使用即构成接受。若任一条款被认定不可执行，其余条款仍然完全有效。
          </p>
        </section>

        <section>
          <h2>13. 联系方式</h2>
          <ul>
            <li>一般支持与计费：yyymalicious@gmail.com</li>
            <li>退款：yyymalicious@gmail.com（标题注明"退款"）</li>
            <li>网站：<a href="https://starrank.lol">https://starrank.lol</a></li>
          </ul>
        </section>

        <p className="legal-footer-note">
          使用服务即在结账时表示您已知悉并同意本条款。<br />
          最后更新：{UPDATED} · StarRank · https://starrank.lol
        </p>
      </article>
      <SiteFooter />
    </main>
  )
}
