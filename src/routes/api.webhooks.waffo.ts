import { createFileRoute } from '@tanstack/react-router'

import { endExpiredTakeovers } from '../server/db.ts'
import { database, readProductionConfig } from '../server/env.ts'
import { persistIgnoredEvent, persistPaidEvent, persistRefundEvent } from '../server/settlement-flow.ts'
import { verifyWaffoWebhookEvent } from '../server/waffo.ts'

// Waffo Pancake HTTP-channel webhook. Register this URL in
// Dashboard → Settings → Webhooks with event `order.completed` (plus refund
// events if you want refunds to decay listings). Verify with the platform
// public key shown in the dashboard for the matching environment.
export const Route = createFileRoute('/api/webhooks/waffo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = readProductionConfig()
        if (!config.waffoMerchantId && !config.waffoWebhookPublicKey) {
          return Response.json(
            { code: 'waffo_unconfigured', message: 'Waffo webhook verification is not configured.' },
            { status: 503 },
          )
        }

        const verification = await verifyWaffoWebhookEvent(request, config)
        if (!verification.ok) {
          return Response.json(
            { code: 'waffo_webhook_rejected', message: verification.message },
            { status: verification.status },
          )
        }

        const db = database()
        const event = verification.value

        if (event.kind === 'ignored') {
          await persistIgnoredEvent(db, event)
          return Response.json({ code: 'ignored', eventType: event.eventType })
        }

        const nowIso = new Date().toISOString()
        await endExpiredTakeovers(db, nowIso)

        if (event.kind === 'refund') {
          const plan = await persistRefundEvent(db, event.snapshot, nowIso)
          return Response.json({
            code: plan.kind === 'replay' ? 'replay' : plan.kind,
            receipt: plan.kind === 'replay' ? plan.receiptStatus : plan.writes.receiptStatus,
          })
        }

        const plan = await persistPaidEvent(db, event.snapshot, nowIso)
        return Response.json({
          code: plan.kind === 'replay' ? 'replay' : plan.kind,
          receipt: plan.kind === 'replay' ? plan.receiptStatus : plan.writes.receiptStatus,
        })
      },
    },
  },
})
