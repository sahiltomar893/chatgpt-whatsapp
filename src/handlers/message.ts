import Logger from '../utils/logger.util';
import { getPrefix } from '../utils/misc';
import { Chat, Message } from 'whatsapp-web.js';
import { ChatMessage, TPrefix } from '../@types/model';
import { sendMessage } from '../configs/openai';
class AppearanceCounter {
  private appearanceCount: { [key: string]: number } = {};
  private resetInterval = 600000; // 1 minute in milliseconds
  
  constructor() {
    setInterval(() => {
      this.appearanceCount = {};
    }, this.resetInterval);
  }
  
  public countAppearance(str: string): void {
    if (this.appearanceCount[str]) {
      this.appearanceCount[str]++;
    } else {
      this.appearanceCount[str] = 1;
    }
  }
  public resetAppearance(str: string): void {
      this.appearanceCount[str] = 0;
  }
  
  public getAppearanceCount(str: string): number {
    return this.appearanceCount[str] || 0;
  }
}

const counter = new AppearanceCounter();
const handler = async (message: Message): Promise<void> => {
  try {

    const start = Date.now();

    const chat: Chat = await message.getChat();

    const prefix: TPrefix = getPrefix(message.body);

    const prompt: ChatMessage = {
      message: prefix.message.trim(),
      systemMessage: prefix.systemMessage,
    };

    if (!prefix.isPrefix && chat.isGroup) return;

    chat.sendStateTyping();
    const fro=message.from.toString();
    Logger.info(`Received prompt from ${message.from}: ${prompt.message}`);
if(prompt.message.toString()=="reset"){
  counter.resetAppearance(fro);
}
counter.countAppearance(fro);
if(counter.getAppearanceCount(fro)<30){
  Logger.info(`Received prompt from ${message.from}: ${counter.getAppearanceCount(fro)}`);
  const response = await sendMessage(prompt);

  Logger.info(`Answer to ${message.from}: ${response.message}`);

  message.reply(response.message);

  const end = Date.now() - start;

  Logger.info(`ChatGPT took ` + end + 'ms');
}
else{
message.reply("Limit Exceeded. Please Subscribe");
}
    // const promptLength = countWords(prompt);
    // if (promptLength > 50) {
    //   return message.reply(
    //     'MAXIMUM OF 50 WORDS PER MESSAGE ONLY.\nFor longer messages please visit \nhttps://chat.openai.com/ \nOr contact Zappy for a custom solution.',
    //   );
    // }

  } catch (error) {
    Logger.error(`Failed to send message to ChatGPT API: ` + error);

    message.reply(
      "I'm sorry, I'm not available at the moment to reply. Please try again after sometime.",
    );
  }
};

export default handler;
