import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [temperature, setTemperature] = useState([0.7]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
          <DialogDescription>
            Customize your Lony Chat experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streaming">Streaming Responses</Label>
                <p className="text-sm text-muted-foreground">
                  See AI responses as they're generated
                </p>
              </div>
              <Switch
                id="streaming"
                checked={streamingEnabled}
                onCheckedChange={setStreamingEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds for actions and notifications
                </p>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Creativity Level</Label>
                <span className="text-sm text-muted-foreground">
                  {temperature[0].toFixed(1)}
                </span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onValueChange={setTemperature}
              />
              <p className="text-xs text-muted-foreground">
                Lower values make responses more focused, higher values more creative
              </p>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h4 className="text-sm font-medium mb-2">Model Information</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Text: Gemini 2.5 Pro</p>
              <p>• Images: Nano Banana (Gemini 2.5 Flash Image)</p>
              <p>• Code: Gemini 2.5 Pro</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
