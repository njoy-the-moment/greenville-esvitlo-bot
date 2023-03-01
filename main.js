// botXXX:XXX should be replaced with a real bot id (from telegram API)
export default {
  async fetch(request, env) {
    return await handleRequest(request, env)
  }
}

async function getStatus(env)
{
  const localDate = new Date()
  const power = await env.NS_SVITLO.get("ajax_power")
  const powerOnDate = new Date(await env.NS_SVITLO.get("ajax_power_on"))
  const powerOffDate = new Date(await env.NS_SVITLO.get("ajax_power_off"))

  const timeDiff = power == 'on' ? localDate.getTime() - powerOnDate.getTime() : localDate.getTime() - powerOffDate.getTime()
  const minutes = Math.floor(timeDiff / 1000 / 60)
  let text = (power == 'on' ? ('%F0%9F%9F%A2' + "Світло є ") : ('%F0%9F%94%B4' + "Світла нема ")) +
    Math.floor(minutes / 60) + ":" + String(minutes % 60).padStart(2, "0") + " (г:хв)" + 
    (power == 'on' ? ' %F0%9F%98%8A' : ' %F0%9F%98%94') + '\r\n' +
    '---\r\n%E2%80%BC' +
    (power == 'on' ? 'Було виключене: ' : 'Було включене:') + '\r\n' +
    " з " + (power == 'on' ? powerOffDate : powerOnDate).toLocaleString("uk-UA", {timeZone: "Europe/Kiev"}) + '\r\n' +
    "по " + (power == 'on' ? powerOnDate : powerOffDate).toLocaleString("uk-UA", {timeZone: "Europe/Kiev"}) + '\r\n'
  return text
}

async function handleRequest(request, env) {
  if (request.method !== "POST")
    return new Response("OK") // Doesn't really matter
  
  // POST
  const localDate = new Date()
  const sendMessageUrl = 'https://api.telegram.org/botXXX:XXX/sendMessage'
  const payload = await request.json() 
  // Checking if the payload comes from Telegram
  if ('message' in payload)
  {
    let respUrl = ''
    const chatId = payload.message.chat.id
    const sendMessageChat = sendMessageUrl + `?chat_id=${chatId}`

    if (payload.message.text == '/chatinfo')
    {
      respUrl = sendMessageChat + `&text=${encodeURIComponent(JSON.stringify(payload.message))}`
    }
    else if (payload.message.text == '/start' || payload.message.text == 'Шо там?')
    {  
      const reply = `&reply_markup={"keyboard":[["Шо там?"],["Дохлої русні","Канал сповіщень"]],"resize_keyboard":true}`
   
      respUrl = `${sendMessageChat}${reply}&text=${await getStatus(env)}`
    }
    else if (payload.message.text == '/notification_group' || payload.message.text == 'Канал сповіщень')
    {
      const chatUrl = 'https://t.me/%2Bo6xNPjDJb8c5Yzdi'
      respUrl = sendMessageChat + '&text=' + chatUrl
    }
    else if (payload.message.text == '/d' || payload.message.text == 'Дохлої русні')
    {
      const r = await fetch('https://russianwarship.rip/api/v1/statistics/latest').then(resp => resp.json())
      let date = new Date(r.data.date)
      const dateFmt = date.toLocaleDateString("uk-UA", {timeZone: "Europe/Kiev"})
      const text = `
        %E2%8F%B0 День *${r.data.day}* (_${dateFmt}_)
        %E2%98%A0 Орків : *${r.data.stats.personnel_units}* (_%2B${r.data.increase.personnel_units}_)
        %E2%9C%88%09 Літаків : *${r.data.stats.planes}* (_%2B${r.data.increase.planes}_)
        %F0%9F%9A%81 Гелікоптерів : *${r.data.stats.helicopters}* (_%2B${r.data.increase.helicopters}_)
        %F0%9F%9A%9C%09 Танків : *${r.data.stats.tanks}* (_%2B${r.data.increase.tanks}_)
        %F0%9F%9A%9A%09 ББМ : *${r.data.stats.armoured_fighting_vehicles}* (_%2B${r.data.increase.armoured_fighting_vehicles}_)
        %F0%9F%94%AB%09 Арт Систем : *${r.data.stats.artillery_systems}* (_%2B${r.data.increase.artillery_systems}_)
        %F0%9F%8C%A0%09 ППО : *${r.data.stats.aa_warfare_systems}* (_%2B${r.data.increase.aa_warfare_systems}_)
        %F0%9F%9A%80 РСЗВ : *${r.data.stats.mlrs}* (_%2B${r.data.increase.mlrs}_)
        %F0%9F%9B%BB Авт : *${r.data.stats.vehicles_fuel_tanks}* (_%2B${r.data.increase.vehicles_fuel_tanks}_)
        %F0%9F%9A%A2 Кораблів : *${r.data.stats.warships_cutters}* (_%2B${r.data.increase.warships_cutters}_)
        %F0%9F%9B%B8%09 БПЛА: *${r.data.stats.uav_systems}* (_%2B${r.data.increase.uav_systems}_)

        `
      
      respUrl = sendMessageChat + '&text=' + text + '&parse_mode=markdown'
    }
    else if (payload.message.text == '/e')
    {
        const pingTimeDb = await env.NS_SVITLO.get("ping")
        let pingDate = new Date(pingTimeDb)
        
        let minutes = Math.floor(localDate.getTime() / 1000 / 60) - Math.floor(pingDate.getTime() / 1000 / 60)
        let text = ""
        text += '%E2%80%BC' + "Бот має затримку 3-5 хв." +
          "\r\nЗараз: " + localDate.toLocaleString("en-US", {timeZone: "Europe/Kiev"}) +
          "\r\nСвітло було: " + pingDate.toLocaleString("en-US", {timeZone: "Europe/Kiev"}) +
          "\r\n-----\r\n"
        if (minutes >= 5)
            text += '%F0%9F%94%B4' + "Світла нема " + Math.floor(minutes / 60) + ":" + (minutes % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + " хв. :("
        else
            text += '%F0%9F%9F%A2' + "Світло є :)"
        const reply = `&reply_markup=%7B%22keyboard%22%3A%20%5B%5B%22%D0%A8%D0%BE%20%D1%82%D0%B0%D0%BC%3F%22%5D%5D%2C%20%22resize_keyboard%22%3Atrue%7D`
        respUrl = `https://api.telegram.org/botXXX:XXX/sendMessage?chat_id=${chatId}&text=${text}${reply}`
    }
    else
    {
      return new Response("Ignored")
    }
    const data = await fetch(respUrl).then(resp => resp.json())    
  }
  else if ('ping' in payload)
  {
    await env.NS_SVITLO.put("ping", localDate.toString())
  }
  else if ('ajax_power' in payload)
  {
    let power = payload.ajax_power

    if (power == 'on' || power == 'off')
    {
      await env.NS_SVITLO.put("ajax_power", power)
      await env.NS_SVITLO.put("ajax_power_" + power, localDate.toString())
      const chatId = '-1001468465663';
      const text = await getStatus(env)

      // greenville house
      const respUrl = sendMessageUrl + `?chat_id=${chatId}&message_thread_id=36812&text=${text}`
      const data = await fetch(respUrl).then(resp => resp.json())

      // dobra oselia
      const respUrl2 = sendMessageUrl + `?chat_id=-1001467212224&message_thread_id=42864&text=${text}`
      const data2 = await fetch(respUrl2).then(resp => resp.json())

      // notification group?
      const respUrl3 = sendMessageUrl + `?chat_id=-1001851588488&text=${text}`
      const data3 = await fetch(respUrl3).then(resp => resp.json())

      return new Response("Power is: " + power)
    }
  }
  return new Response("Default Post")
}
//{"message":{"chat":{"id":"551913770"}},"text":"/b"}
//{"ping":"yes"}
//{"ajax_power":"on"}
//https://api.telegram.org/botXXX:XXX/getupdates
//https://api.telegram.org/botXXX:XXX/setWebhook?remove
//https://api.telegram.org/botXXX:XXX/sendMessage?chat_id=-1001468465663&message_thread_id=36812&text=please_ignore
