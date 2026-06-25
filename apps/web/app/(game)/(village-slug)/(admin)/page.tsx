import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { EconomyTab } from './components/economy-tab';
import { EventInspectorTab } from './components/event-inspector-tab';
import { LogsReportsTab } from './components/logs-reports-tab';
import { NpcBrainTab } from './components/npc-brain-tab';
import { PlayerVillageTab } from './components/player-village-tab';
import { ServerControlTab } from './components/server-control-tab';
import { SmartLogPanel } from './components/smart-log-panel';
import { TroopManagementTab } from './components/troop-management-tab';
import { WorldWonderTab } from './components/world-wonder-tab';

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-[1600px] p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
        <SmartLogPanel />
      </div>
      <Tabs defaultValue="server">
        <TabList className="flex-wrap h-auto">
          <Tab value="server">Server</Tab>
          <Tab value="player">Player & Villages</Tab>
          <Tab value="troops">Troops</Tab>
          <Tab value="wonder">World Wonder</Tab>
          <Tab value="npc">NPC Brain</Tab>
          <Tab value="events">Events</Tab>
          <Tab value="economy">Economy</Tab>
          <Tab value="logs">Logs & Reports</Tab>
        </TabList>

        <TabPanel value="server">
          <ServerControlTab />
        </TabPanel>
        <TabPanel value="player">
          <PlayerVillageTab />
        </TabPanel>
        <TabPanel value="troops">
          <TroopManagementTab />
        </TabPanel>
        <TabPanel value="wonder">
          <WorldWonderTab />
        </TabPanel>
        <TabPanel value="npc">
          <NpcBrainTab />
        </TabPanel>
        <TabPanel value="events">
          <EventInspectorTab />
        </TabPanel>
        <TabPanel value="economy">
          <EconomyTab />
        </TabPanel>
        <TabPanel value="logs">
          <LogsReportsTab />
        </TabPanel>
      </Tabs>
    </div>
  );
}
