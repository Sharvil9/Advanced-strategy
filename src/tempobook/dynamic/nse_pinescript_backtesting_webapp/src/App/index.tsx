import { useEffect } from 'react';
import App from "./../../../../../../nse_pinescript_backtesting_webapp/src/App.tsx";


const args = {
};

const TempoComponent = () => {
  const notifyStoryRenderedArgs = () => {
    const notification = { filepath: '/home/peter/tempo-api/projects/06/75/06752816-8662-427b-82f2-8953b408996f/nse_pinescript_backtesting_webapp/src/App.tsx', componentName: 'App', args };
    if (typeof window !== "undefined" && (window as any).notifyStoryRenderedArgs) {
      (window as any).notifyStoryRenderedArgs(notification);
    } else if (typeof window !== "undefined") {
      if (!Array.isArray((window as any).pendingStoryArgsNotifications)) {
        (window as any).pendingStoryArgsNotifications = [];
      }
      (window as any).pendingStoryArgsNotifications.push(notification);
    }
  }

  notifyStoryRenderedArgs();

  return <App {...args}/>;
}



export default TempoComponent;