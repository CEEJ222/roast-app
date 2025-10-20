import { useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const useClipboard = () => {
  const [isSupported, setIsSupported] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.write({
        string: text
      });
      
      // Provide haptic feedback
      await Haptics.impact({ style: ImpactStyle.Light });
      
      console.log('Text copied to clipboard');
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const readFromClipboard = async () => {
    try {
      const result = await Clipboard.read();
      return result.value;
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      return null;
    }
  };

  const copyRoastData = async (roast) => {
    const roastSummary = `
Roast Summary:
Date: ${new Date(roast.created_at).toLocaleDateString()}
Machine: ${roast.machine_name || roast.machine_label || 'Unknown'}
Coffee: ${roast.coffee_region || ''} ${roast.coffee_type || ''}
Roast Level: ${roast.desired_roast_level || 'Not specified'}
Weight In: ${roast.weight_before_g ? `${roast.weight_before_g}g` : 'N/A'}
Weight Out: ${roast.weight_after_g ? `${roast.weight_after_g}g` : 'N/A'}
Weight Loss: ${roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'}
Duration: ${roast.t_drop ? `${roast.t_drop} minutes` : 'N/A'}
Notes: ${roast.notes || 'None'}
Tasting Notes: ${roast.tasting_notes || 'None'}
    `.trim();

    return await copyToClipboard(roastSummary);
  };

  const copyRoastEvents = async (events, formatTime) => {
    const eventsText = events
      .map(event => {
        const time = formatTime ? formatTime(event.t_offset_sec) : `${event.t_offset_sec}s`;
        return `${time}: ${event.kind}${event.temp_f ? ` - ${event.temp_f}°F` : ''}${event.note ? ` (${event.note})` : ''}`;
      })
      .join('\n');

    const eventsSummary = `Roast Events:\n${eventsText}`;
    return await copyToClipboard(eventsSummary);
  };

  return {
    isSupported,
    copyToClipboard,
    readFromClipboard,
    copyRoastData,
    copyRoastEvents
  };
};

export default useClipboard;
