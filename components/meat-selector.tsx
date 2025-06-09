"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { MeatType } from "@/lib/types"
import { getMeatInfo } from "@/lib/utils"

interface MeatSelectorProps {
  onSelect: (meat: MeatType) => void
  onClose: () => void
}

export function MeatSelector({ onSelect, onClose }: MeatSelectorProps) {
  const meatTypes: MeatType[] = [
    "beef_brisket",
    "beef_ribs",
    "beef_tenderloin",
    "pork_shoulder",
    "pork_ribs",
    "pork_tenderloin",
    "chicken_breast",
    "chicken_thigh",
    "lamb_chops",
  ]

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-amber-500">Select Meat Type</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {meatTypes.map((meat) => {
            const meatInfo = getMeatInfo(meat)
            return (
              <Card
                key={meat}
                className="cursor-pointer hover:scale-105 transition-transform border-gray-700 bg-gray-800"
                onClick={() => onSelect(meat)}
              >
                <CardContent className="p-3">
                  <div
                    className="h-24 mb-2 rounded-md bg-center bg-cover"
                    style={{ backgroundImage: `url(${meatInfo.image})` }}
                  />
                  <h3 className="text-center font-medium text-white">{meatInfo.label}</h3>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
