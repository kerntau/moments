import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface EmojiProps {
  onSelected: (emoji: string) => void;
}

const tabItems = [
  {
    key: 'common',
    label: '常用',
    icons: [...'😀😁😂😄😅😆😉😊😋😎😍😘😗😙😚😇😐😑😶😏😣😥😮😯😪😫😴😌😛😜😝😒😓😔😕😲😷😖😞😟😤😢😭😦😧😨😬😰😱😳😵😡😠👻👽💘💓💔💕💖💞💰💯'],
  },
  {
    key: 'character',
    label: '人物',
    icons: [...'👦👧🎅🙅🙆💁🙋🙌🙏👤👥🏃👯💏👪💪👈👆👌👍✊👏📶👣👖👗👔👜👠💄💍🌂🌏☔🌟⛲🐵🐶🐕😿🐈🐆🐮🐷🐗🐏🐘🐇🐻🐼🐔🐣🐸🐍🐉🐳🐟🐡🐙🐚🐛🐝🦋'],
  },
  {
    key: 'food',
    label: '食物',
    icons: [...'🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🍅🍆🌽🍄🌰🍞🍖🍗🍔🍟🍕🍳🍲🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🍡🍦🍧🍨🍩🍪🎂🍰🍫🍬🍭🍮🍯🍼☕🍵🍶🍷🍸🍹🍺🍻🍴'],
  },
  {
    key: 'thing',
    label: '物品',
    icons: [...'💌💎💈🚪🚿🛁⌛⏰🎈🎉<ctrl42>⏰🎈🎉🎎🎏🎐🎀🎁📱☎📞📟📠🔋🔌💻💾💿📺📷📼🔍🔬🔭📡💡📃📰💰📧📨📦📫📭✏📝📂📅📇📈📊📋📌📍📏📐🔓🔏🔑🔨🔫🔗💉💊🚩💦'],
  },
  {
    key: 'logo',
    label: '标志',
    icons: [...'♠♥♦♣🀄🎴🔇🔈🔉🔊📢📣💤💢💬💭♨🌀🔔🔕✡✝🔯📛🔰🔱⭕✅❌➕➖➗➰➿〽✳✴❇‼⁉❓❔🎦🔠🔤🅰🆎🅱🆑🆒🆔🆖🆗🆙🆚🈁🈶🈯🉐🈹🈚🈲🉑🈸🈴🈳🈺🈵'],
  },
];

export const Emoji: React.FC<EmojiProps> = ({ onSelected }) => {
  return (
    <Tabs defaultValue="common" className="mt-2 w-full">
      <TabsList className="h-8 p-1 flex justify-start space-x-1 bg-neutral-100 dark:bg-neutral-800">
        {tabItems.map((item) => (
          <TabsTrigger
            key={item.key}
            value={item.key}
            className="text-xs h-6 px-2 py-0.5 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabItems.map((item) => (
        <TabsContent key={item.key} value={item.key}>
          <div className="flex flex-wrap gap-1 text-lg rounded border border-neutral-200 dark:border-neutral-700 p-2 shadow-md bg-white dark:bg-neutral-900 select-none mt-1 max-h-40 overflow-y-auto">
            {item.icons.map((icon, idx) => (
              <span
                key={idx}
                className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1 rounded transition"
                onClick={() => onSelected(icon)}
              >
                {icon}
              </span>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};
