import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  script_id: string;
  amount: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { script_id, amount, currency }: PaymentRequest = await req.json()

    if (!script_id || !amount || !currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: script, error: scriptError } = await supabaseClient
      .from('scripts')
      .select('id, name, price')
      .eq('id', script_id)
      .single()

    if (scriptError || !script) {
      console.error('Script error:', scriptError)
      return new Response(
        JSON.stringify({ error: 'Script not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (script.price !== amount) {
      return new Response(
        JSON.stringify({ error: 'Amount mismatch' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('script_id', script_id)
      .eq('status', 'completed')
      .maybeSingle()

    if (existingPayment) {
      return new Response(
        JSON.stringify({ error: 'Script already purchased' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const binanceApiKey = Deno.env.get('BINANCE_API_KEY')
    const binanceApiSecret = Deno.env.get('BINANCE_API_SECRET')

    if (!binanceApiKey || !binanceApiSecret) {
      console.error('Missing Binance API credentials')
      return new Response(
        JSON.stringify({ error: 'Payment service unavailable' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const orderId = `script_${script_id}_${user.id}_${Date.now()}`
    
    const paymentData = {
      merchantId: binanceApiKey,
      subMerchant: 'SFAXIEN_SCRIPTS',
      merchantTradeNo: orderId,
      orderAmount: amount.toString(),
        currency: 'BNB',
      goods: {
        goodsType: '02',
        goodsCategory: 'Software',
        referenceGoodsId: script_id,
        goodsName: script.name,
      },
      returnUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
      cancelUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-cancel`
    }

    const depositAddress = '0xebb11a6839fb387a3dae9cadf463571901da0744';
    const mockPaymentUrl = `https://pay.binance.com/checkout?orderId=${orderId}&amount=${amount}&currency=BNB&address=${depositAddress}`

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        script_id: script_id,
        amount: amount,
        currency: 'BNB',
        status: 'pending',
        binance_order_id: orderId,
        payment_url: mockPaymentUrl
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Payment created for user ${user.id}, script ${script_id}, amount ${amount} ${currency}`)

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        payment_url: mockPaymentUrl,
        order_id: orderId,
        amount: amount,
        currency: 'BNB'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})