import {useState} from "react";
import {TouchableOpacity, Text, View} from "react-native";
import ContextMenu from "@/components/ContextMenu";

export default function NoteCard() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <View>
            <TouchableOpacity
                className="bg-white dark:bg-gray-800 p-4 rounded-xl"
                onLongPress={() => setMenuOpen(true)}
            >
                <Text className="text-black dark:text-white">My Note</Text>
            </TouchableOpacity>

            <ContextMenu
                visible={menuOpen}
                onClose={() => setMenuOpen(false)}
                onEdit={() => console.log("Edit")}
                onShare={() => console.log("Share")}
                onDelete={() => console.log("Delete")}
            />
        </View>
    );
}
