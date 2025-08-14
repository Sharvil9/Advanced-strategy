import { useEffect } from 'react';
import App from "./../../../../../../nse_pinescript_backtesting_webapp/src/App.tsx";


const args = {
};

const TempoComponent = () => {
  const notifyStoryRenderedArgs = () => {
    const notification = { filepath: '/home/peter/tempo-api/projects/ae/f6/aef628a8-3d5d-4ddf-ab19-9b069f20d899/nse_pinescript_backtesting_webapp/src/App.tsx', componentName: 'App', args };
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