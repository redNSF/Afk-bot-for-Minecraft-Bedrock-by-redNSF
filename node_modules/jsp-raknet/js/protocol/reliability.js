const RELIABLE = [2, 3, 4, 6, 7];
// http://www.jenkinssoftware.com/raknet/manual/reliabilitytypes.html
// Used to recognize packet reliability and know what to write in buffer
const Reliability = {
    Unreliable: 0,
    UnreliableSequenced: 1,
    Reliable: 2,
    ReliableOrdered: 3,
    ReliableSequenced: 4,
    UnreliableWithAckReceipt: 5,
    ReliableWithAckReceipt: 6,
    ReliableOrderedWithAckReceipt: 7,
    isReliable(reliability) {
        return RELIABLE.includes(reliability);
    },
    sequencedOrOrdered(reliability) {
        switch (reliability) {
            case this.UnreliableSequenced:
            case this.ReliableOrdered:
            case this.ReliableSequenced:
                return true;
            default:
                return false;
        }
    },
    sequenced(reliability) {
        switch (reliability) {
            case this.UnreliableSequenced:
            case this.ReliableSequenced:
                return true;
            default:
                return false;
        }
    }
};
module.exports = Reliability;
